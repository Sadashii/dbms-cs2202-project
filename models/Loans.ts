import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoan extends Document {
    loanReference: string; 
    userId: Types.ObjectId;
    accountId: Types.ObjectId; 
    loanType: 'Personal' | 'Home' | 'Auto' | 'Education' | 'Business';
    principalAmount: Types.Decimal128;
    interestRate: Types.Decimal128;
    tenureMonths: number;
    emiAmount: Types.Decimal128;
    remainingAmount: Types.Decimal128;
    totalAmountPaid: Types.Decimal128; // Added for auditing
    currency: 'INR' | 'USD' | 'EUR';
    currentStatus: 'Applied' | 'Approved' | 'Disbursed' | 'Active' | 'Rejected' | 'Closed' | 'Defaulted';

    disbursedAt?: Date;
    nextPaymentDate?: Date;
    maturityDate?: Date;

    metadata?: {
        ipAddress?: string;
        remarks?: string;
        processedBy?: Types.ObjectId; 
    };
    assets: Array<{
        assetType: string;
        valuation: Types.Decimal128;
        description?: string;
        documentUrl?: string;
    }>;
    statusHistory: Array<{
        state: 'Applied' | 'Approved' | 'Disbursed' | 'Active' | 'Rejected' | 'Closed' | 'Defaulted';
        updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>({
    loanReference: { 
        type: String, 
        unique: true, 
        required: true,
        immutable: true,
        uppercase: true,
        trim: true
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true,
        immutable: true
    },
    accountId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Account', 
        required: true,
        immutable: true
    },
    loanType: { 
        type: String, 
        enum: ['Personal', 'Home', 'Auto', 'Education', 'Business'],
        required: true,
        immutable: true 
    },
    principalAmount: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'Principal cannot be negative'],
        immutable: true 
    },
    interestRate: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'Interest rate cannot be negative'],
        immutable: true
    },
    tenureMonths: { 
        type: Number, 
        required: true,
        min: [1, 'Tenure must be at least 1 month'],
        immutable: true 
    },
    emiAmount: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'EMI cannot be negative'],
        immutable: true
    },
    
    remainingAmount: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0, 'Remaining amount cannot drop below zero']
    },
    totalAmountPaid: {
        type: Schema.Types.Decimal128,
        default: 0.00,
        min: [0, 'Total paid cannot be negative']
    },

    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR'],
        immutable: true
    },
    currentStatus: { 
        type: String, 
        enum: ['Applied', 'Approved', 'Disbursed', 'Active', 'Rejected', 'Closed', 'Defaulted'], 
        default: 'Applied',
        index: true
    },

    disbursedAt: { type: Date },
    nextPaymentDate: { type: Date, index: true },
    maturityDate: { type: Date },

    metadata: {
        ipAddress: { type: String },
        remarks: { type: String },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' } 
    },
    assets: [{
        assetType: { type: String, required: true },
        valuation: { type: Schema.Types.Decimal128, required: true, min: 0 },
        description: { type: String },
        documentUrl: { type: String }
    }],
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Applied', 'Approved', 'Disbursed', 'Active', 'Rejected', 'Closed', 'Defaulted'],
            required: true
        },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    optimisticConcurrency: true 
});

LoanSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date()
        });

        // Auto-set disbursement date if status changes to Disbursed
        if (this.currentStatus === 'Disbursed' && !this.disbursedAt) {
            this.disbursedAt = new Date();
        }
    }
    
});

LoanSchema.index({ userId: 1, currentStatus: 1 });
LoanSchema.index({ currentStatus: 1, nextPaymentDate: 1 });

export default mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema);