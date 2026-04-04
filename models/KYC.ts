import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. Define the TypeScript interface
export interface IKYC extends Document {
    kycReference: string; 
    userId: Types.ObjectId; 
    
    documentType: 'Passport' | 'SSN' | 'National_ID' | 'Driving_License' | 'PAN' | 'Aadhar';
    
    documentDetails: {
        // The actual number MUST be encrypted at the application layer before saving to Mongo.
        // Libraries like mongoose-field-encryption are highly recommended here.
        encryptedNumber: string; 
        // A cryptographic hash (e.g., SHA-256) of the number. 
        // Used to prevent the same ID from being used by multiple accounts without decrypting.
        numberHash: string;      
        expiryDate?: Date;   
        issuedCountry: string;
    };

    attachments: Array<{
        fileUrl: string; // Should point to a secured, private S3 bucket, NOT a public URL
        fileName: string;
        fileType: 'Front' | 'Back' | 'Selfie' | 'Full';
        uploadedAt: Date;
    }>;

    currentStatus: 'Pending' | 'In-Review' | 'Verified' | 'Rejected' | 'Expired';
    
    verifiedAt?: Date;

    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        verifiedBy?: Types.ObjectId; 
        rejectionReason?: string;    
    };

    statusHistory: Array<{
        state: 'Pending' | 'In-Review' | 'Verified' | 'Rejected' | 'Expired';
        remarks?: string;
        updatedBy?: Types.ObjectId; 
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

// 2. Define the Schema
const KYCSchema = new Schema<IKYC>({
    kycReference: { 
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
        immutable: true // An application belongs to one user forever
    },
    documentType: { 
        type: String, 
        enum: ['Passport', 'SSN', 'National_ID', 'Driving_License', 'PAN', 'Aadhar'], 
        required: true, 
        immutable: true // Cannot change document type once submitted
    },
    documentDetails: {
        encryptedNumber: { type: String, required: true, immutable: true },
        numberHash: { type: String, required: true, index: true, immutable: true },
        expiryDate: { type: Date, immutable: true },
        issuedCountry: { type: String, required: true, default: 'India', immutable: true }
    },
    attachments: [{
        fileUrl: { type: String, required: true, immutable: true },
        fileName: { type: String, required: true, immutable: true },
        fileType: { type: String, enum: ['Front', 'Back', 'Selfie', 'Full'], required: true, immutable: true },
        uploadedAt: { type: Date, default: Date.now, immutable: true }
    }],
    currentStatus: { 
        type: String, 
        enum: ['Pending', 'In-Review', 'Verified', 'Rejected', 'Expired'], 
        default: 'Pending',
        index: true
    },
    verifiedAt: { type: Date },
    metadata: {
        ipAddress: { type: String, immutable: true },
        userAgent: { type: String, immutable: true },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectionReason: { type: String }
    },
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Pending', 'In-Review', 'Verified', 'Rejected', 'Expired'],
            required: true
        },
        remarks: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    // CRITICAL: Prevents two admins from reviewing/verifying the same application at the exact same time
    optimisticConcurrency: true 
});

// --- Middleware / Hooks ---

// Automatically track KYC lifecycle changes
KYCSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            remarks: this.metadata?.rejectionReason || `Status changed to ${this.currentStatus}`,
            updatedBy: this.metadata?.verifiedBy, // Will be undefined if done by system, which is fine
            updatedAt: new Date()
        });
        
        // Auto-set verifiedAt timestamp when status is Verified
        if (this.currentStatus === 'Verified' && !this.verifiedAt) {
            this.verifiedAt = new Date();
        }
    }
    
});

// --- Indexes ---

// Find a specific user's active KYC
KYCSchema.index({ userId: 1, currentStatus: 1 });

// CRITICAL for Admin Dashboards: Fetch the oldest pending applications first
KYCSchema.index({ currentStatus: 1, createdAt: 1 });

// Cron Job Optimization: Quickly find Verified IDs that have passed their expiry date
KYCSchema.index({ currentStatus: 1, "documentDetails.expiryDate": 1 });

// To prevent duplicate ID use across different users (using the hash)
KYCSchema.index({ "documentDetails.numberHash": 1 });

// Note: Removed redundant `kycReference` index since `unique: true` handles it.

export default mongoose.models.KYC || mongoose.model<IKYC>("KYC", KYCSchema);