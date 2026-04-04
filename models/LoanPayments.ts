import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoanPayment extends Document {
    paymentReference: string; 
    loanId: Types.ObjectId;   
    userId: Types.ObjectId;   
    transactionId?: Types.ObjectId; 
    
    // Financial Tracking
    amountExpected: Types.Decimal128; // What the cron job billed
    amountPaid: Types.Decimal128;     // What the user actually paid
    
    // Component Breakdown (Crucial for ledger reconciliation)
    principalComponent: Types.Decimal128; 
    interestComponent: Types.Decimal128;  
    lateFeeComponent: Types.Decimal128;   
    
    currency: 'INR' | 'USD' | 'EUR';
    dueDate: Date;
    paidDate?: Date;
    
    currentStatus: 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Failed' | 'Refunded';
    
    metadata?: {
        paymentMethod: 'Internal_Transfer' | 'External_ACH' | 'Cash' | 'Cheque';
        ipAddress?: string;
        failureReason?: string;
        notes?: string;
    };
    
    statusHistory: Array<{
        state: 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Failed' | 'Refunded';
        updatedAt: Date;
    }>;
    
    createdAt: Date;
    updatedAt: Date;
}

// 2. Define the Schema
const LoanPaymentSchema = new Schema<ILoanPayment>({
    paymentReference: { 
        type: String, 
        unique: true, 
        required: true,
        immutable: true, // Idempotency key
        uppercase: true,
        trim: true
    },
    loanId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Loan', 
        required: true,
        index: true,
        immutable: true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true,
        immutable: true 
    },
    transactionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Transaction',
        immutable: true 
    },
    amountExpected: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'Expected amount cannot be negative']
    },
    amountPaid: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'Amount paid cannot be negative']
    },
    principalComponent: { 
        type: Schema.Types.Decimal128, 
        required: true,
        default: 0.00,
        min: [0, 'Principal component cannot be negative']
    },
    interestComponent: { 
        type: Schema.Types.Decimal128, 
        required: true,
        default: 0.00,
        min: [0, 'Interest component cannot be negative']
    },
    lateFeeComponent: { 
        type: Schema.Types.Decimal128, 
        required: true,
        default: 0.00,
        min: [0, 'Late fee component cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR'],
        immutable: true
    },
    dueDate: { 
        type: Date, 
        required: true,
        immutable: true
    },
    paidDate: { 
        type: Date 
    },
    currentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Partial', 'Overdue', 'Failed', 'Refunded'], 
        default: 'Pending',
        index: true
    },
    metadata: {
        paymentMethod: { 
            type: String, 
            enum: ['Internal_Transfer', 'External_ACH', 'Cash', 'Cheque'],
            default: 'Internal_Transfer'
        },
        ipAddress: { type: String },
        failureReason: { type: String },
        notes: { type: String }
    },
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Pending', 'Paid', 'Partial', 'Overdue', 'Failed', 'Refunded'],
            required: true
        },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    optimisticConcurrency: true 
});

// --- Validation / Hooks ---

// 1. Mathematical Reconciliation Validation
LoanPaymentSchema.pre('validate', function(next) {
    // Convert Decimal128 to float for mathematical validation
    const paid = parseFloat(this.amountPaid.toString());
    const principal = parseFloat(this.principalComponent.toString());
    const interest = parseFloat(this.interestComponent.toString());
    const lateFee = parseFloat(this.lateFeeComponent.toString());

    // The components MUST exactly equal the amount paid
    // Adding a tiny epsilon to account for JS floating point math quirks
    const totalComponents = principal + interest + lateFee;
    if (Math.abs(paid - totalComponents) > 0.001) {
        this.invalidate(
            'amountPaid', 
            `Amount Paid (${paid}) must equal the sum of principal, interest, and late fees (${totalComponents}).`
        );
    }
    
    
});

// 2. Automatically track payment lifecycle changes
LoanPaymentSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date()
        });

        // Set paidDate automatically when status changes to Paid or Partial
        if (['Paid', 'Partial'].includes(this.currentStatus) && !this.paidDate) {
            this.paidDate = new Date();
        }
    }
    
});

// --- Indexes ---

// Find overdue/pending payments for a specific loan quickly
LoanPaymentSchema.index({ loanId: 1, currentStatus: 1, dueDate: 1 });

// Dashboard query: Find a user's recent payments
LoanPaymentSchema.index({ userId: 1, currentStatus: 1, createdAt: -1 });

// Note: Removed the explicitly defined index for `paymentReference` because 
// `unique: true` already creates one natively in MongoDB.

export default mongoose.models.LoanPayment || mongoose.model<ILoanPayment>("LoanPayment", LoanPaymentSchema);