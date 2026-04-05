import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccountRequest extends Document {
    userId: Types.ObjectId;
    accountType: 'Savings' | 'Current' | 'Fixed';
    
    kycDocuments: {
        panCardFileUrl: string; 
        signatureFileUrl: string;
        aadharFileUrl: string;
    };
    
    currentStatus: 'Pending_KYC' | 'Approved' | 'Rejected';
    
    // Full lifecycle history — consistent with every other model in the project
    statusHistory: Array<{
        state: 'Pending_KYC' | 'Approved' | 'Rejected';
        updatedBy?: Types.ObjectId;
        remarks?: string;
        updatedAt: Date;
    }>;

    metadata?: {
        ipAddress?: string;
        rejectionReason?: string;
        reviewedBy?: Types.ObjectId;
    };
    
    createdAt: Date;
    updatedAt: Date;
}

const AccountRequestSchema = new Schema<IAccountRequest>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true,
        immutable: true
    },
    accountType: { 
        type: String, 
        enum: ['Savings', 'Current', 'Fixed'], 
        required: true 
    },
    kycDocuments: {
        panCardFileUrl: { type: String, required: true },
        signatureFileUrl: { type: String, required: true },
        aadharFileUrl: { type: String, required: true }
    },
    currentStatus: { 
        type: String, 
        enum: ['Pending_KYC', 'Approved', 'Rejected'], 
        default: 'Pending_KYC', 
        index: true 
    },
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Pending_KYC', 'Approved', 'Rejected'],
            required: true
        },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],
    metadata: {
        ipAddress: { type: String },
        rejectionReason: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
}, { 
    timestamps: true 
});

// Automatically track status lifecycle changes
AccountRequestSchema.pre('save', async function() {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: this.metadata?.reviewedBy,
            remarks: this.metadata?.rejectionReason,
            updatedAt: new Date()
        });
    }
});

// Compound index: quickly fetch oldest pending requests for admin review queue
AccountRequestSchema.index({ currentStatus: 1, createdAt: 1 });

export default mongoose.models.AccountRequest || mongoose.model<IAccountRequest>("AccountRequest", AccountRequestSchema);