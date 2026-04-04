import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccountRequest extends Document {
    userId: Types.ObjectId;
    accountType: 'Savings' | 'Current' | 'Fixed';
    
    kycDocuments: {
        panCardFileUrl: string; 
        signatureFileUrl: string;
        aadharFileUrl: string; // NEW: Added Aadhar
    };
    
    currentStatus: 'Pending_KYC' | 'Approved' | 'Rejected';
    
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
        aadharFileUrl: { type: String, required: true } // NEW
    },
    currentStatus: { 
        type: String, 
        enum: ['Pending_KYC', 'Approved', 'Rejected'], 
        default: 'Pending_KYC', 
        index: true 
    },
    metadata: {
        ipAddress: { type: String },
        rejectionReason: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
}, { 
    timestamps: true 
});

export default mongoose.models.AccountRequest || mongoose.model<IAccountRequest>("AccountRequest", AccountRequestSchema);