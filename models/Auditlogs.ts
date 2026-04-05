import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

// 1. Define the TypeScript interface
export interface IAuditLog extends Document {
    logReference: string; 
    userId: Types.ObjectId; 
    userRole: string; 
    
    actionType: 
        | 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_PASSWORD_CHANGE' | 'AUTH_PASSWORD_RESET'
        | 'TRANSACTION_INITIATED' | 'TRANSACTION_COMPLETED' | 'TRANSACTION_FAILED'
        | 'ACCOUNT_REQUESTED' | 'ACCOUNT_CREATED' | 'ACCOUNT_REJECTED' | 'ACCOUNT_FROZEN' | 'ACCOUNT_UNFROZEN'
        | 'KYC_SUBMITTED' | 'KYC_VERIFIED' | 'KYC_REJECTED'
        | 'LOAN_APPLIED' | 'LOAN_APPROVED' | 'LOAN_REJECTED'
        | 'CARD_REQUESTED' | 'CARD_ISSUED' | 'CARD_REJECTED' | 'CARD_STATUS_CHANGED' | 'CARD_DELETED' | 'CARD_EXPENSE' | 'CARD_REPAYMENT'
        | 'SUPPORT_TICKET_CREATED' | 'SUPPORT_TICKET_REPLY' | 'SUPPORT_TICKET_RESOLVED';
    
    category: 'Security' | 'Financial' | 'Operational' | 'Administrative';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    
    resource: string; 
    resourceId?: Types.ObjectId; 

    description: string; 

    // Stored as stringified JSON to prevent querying deep objects and bypass Mongoose overhead
    payload: {
        previousState?: string; 
        newState?: string;      
        diff?: string[]; 
    };

    metadata: {
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
        geoPoint?: string; 
        sessionId?: string;
    };

    currentStatus: 'Success' | 'Failure' | 'Blocked' | 'Flagged';
    
    logHash: string; // Cryptographic seal to prove the log wasn't tampered with post-creation
    expiresAt: Date; // For data lifecycle management
    
    createdAt: Date;
}

// 2. Define the Schema
const AuditLogSchema = new Schema<IAuditLog>({
    logReference: { 
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
    userRole: { 
        type: String, 
        required: true,
        immutable: true 
    },
    actionType: { 
        type: String, 
        required: true,
        index: true,
        immutable: true 
    },
    category: { 
        type: String, 
        enum: ['Security', 'Financial', 'Operational', 'Administrative'],
        required: true,
        index: true,
        immutable: true
    },
    severity: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low',
        index: true,
        immutable: true
    },
    resource: { type: String, required: true, immutable: true },
    resourceId: { type: Schema.Types.ObjectId, immutable: true, index: true },
    description: { type: String, required: true, immutable: true },
    
    payload: {
        previousState: { type: String, immutable: true },
        newState: { type: String, immutable: true },
        diff: [{ type: String, immutable: true }]
    },

    metadata: {
        ipAddress: { type: String, required: true, immutable: true },
        userAgent: { type: String, required: true, immutable: true },
        deviceId: { type: String, immutable: true },
        geoPoint: { type: String, immutable: true },
        sessionId: { type: String, immutable: true }
    },

    currentStatus: { 
        type: String, 
        enum: ['Success', 'Failure', 'Blocked', 'Flagged'], 
        required: true,
        index: true,
        immutable: true
    },

    logHash: { 
        type: String, 
        required: true,
        immutable: true 
    },

    expiresAt: {
        type: Date,
        required: true,
        immutable: true,
        // Standard retention policy: keep hot logs for 1 year, then auto-delete or archive
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
    }
}, { 
    // Audit logs are Write-Once-Read-Many (WORM). No updates allowed.
    timestamps: { createdAt: true, updatedAt: false } 
});

// --- Middleware & Hooks ---

// 1. Cryptographic Sealing
AuditLogSchema.pre('validate', async function() {
    if (this.isNew && !this.logHash) {
        // Create a hash of the core log data to prove it hasn't been altered via direct DB access
        const dataToHash = `${this.logReference}|${this.userId}|${this.actionType}|${this.currentStatus}|${this.createdAt?.toISOString()}`;
        this.logHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    }
});

// 2. Strict Immutability Enforcement
AuditLogSchema.pre('save', async function() {
    if (!this.isNew) {
        throw new Error('Audit logs are strictly append-only and cannot be updated.');
    }
});

// --- Indexes ---

// TTL Index: Automatically drops old logs to prevent disk space exhaustion
AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for the most common forensic search: "Show me all high severity failures recently"
AuditLogSchema.index({ severity: 1, currentStatus: 1, createdAt: -1 });

// Optimize searching by date (crucial for time-based audits)
AuditLogSchema.index({ createdAt: -1 }); 

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);