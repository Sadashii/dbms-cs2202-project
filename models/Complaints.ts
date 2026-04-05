import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
    ticketId: string; 
    userId: Types.ObjectId; 
    
    category: 'Transaction' | 'Loan' | 'Account' | 'KYC' | 'Card' | 'Other';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    subject: string;
    description: string; 
    
    assignedTo?: Types.ObjectId; 
    
    currentStatus: 'Open' | 'In-Progress' | 'Resolved' | 'Closed' | 'Re-Opened';
    
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        relatedTransactionId?: Types.ObjectId; 
        relatedAccountId?: Types.ObjectId;
    };

    statusHistory: Array<{
        state: 'Open' | 'In-Progress' | 'Resolved' | 'Closed' | 'Re-Opened';
        updatedBy?: Types.ObjectId; // Should be explicitly set by the service layer
        remarks?: string;
        updatedAt: Date;
    }>;

    lastMessageAt: Date; // Denormalized for fast sorting in admin dashboards
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
    ticketId: { 
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
        immutable: true // A ticket cannot change the customer who opened it
    },
    category: { 
        type: String, 
        enum: ['Transaction', 'Loan', 'Account', 'KYC', 'Card', 'Other'],
        required: true,
        immutable: true // Re-categorizing usually implies closing and opening a new specific ticket
    },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        index: true 
    },
    subject: { 
        type: String, 
        required: true,
        trim: true,
        immutable: true 
    },
    description: { 
        type: String, 
        required: true,
        immutable: true 
    },
    assignedTo: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        index: true 
    },
    currentStatus: { 
        type: String, 
        enum: ['Open', 'In-Progress', 'Resolved', 'Closed', 'Re-Opened'], 
        default: 'Open',
        index: true
    },
    metadata: {
        ipAddress: { type: String, immutable: true },
        userAgent: { type: String, immutable: true },
        relatedTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', immutable: true },
        relatedAccountId: { type: Schema.Types.ObjectId, ref: 'Account', immutable: true }
    },
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Open', 'In-Progress', 'Resolved', 'Closed', 'Re-Opened'],
            required: true
        },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],
    lastMessageAt: { 
        type: Date, 
        default: Date.now,
        index: true 
    },
    resolvedAt: { type: Date }
}, { 
    timestamps: true,
    // CRITICAL: Prevents race conditions if two agents try to assign/resolve simultaneously
    optimisticConcurrency: true 
});

// Middleware to track status history and resolution time
ComplaintSchema.pre('save', async function() {
    if (this.isModified('currentStatus')) {
        // updatedBy should be explicitly set on the document by the controller before .save()
        const lastEntry = this.statusHistory[this.statusHistory.length - 1];
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: lastEntry?.updatedBy, 
            updatedAt: new Date()
        });

        if (['Resolved', 'Closed'].includes(this.currentStatus) && !this.resolvedAt) {
            this.resolvedAt = new Date();
        }
        
        if (this.currentStatus === 'Re-Opened') {
            this.resolvedAt = undefined;
        }
    }
});

// Optimized indexes for support dashboard
// 1. "Show me my assigned open tickets, sorted by latest message"
ComplaintSchema.index({ assignedTo: 1, currentStatus: 1, lastMessageAt: -1 });

// 2. "Show me high priority open tickets"
ComplaintSchema.index({ priority: 1, currentStatus: 1 });

export default mongoose.models.Complaint || mongoose.model<IComplaint>("Complaint", ComplaintSchema);