import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. Define the TypeScript interface
export interface IBranch extends Document {
    branchCode: string; 
    branchName: string;
    branchType: 'Main' | 'Mini' | 'ATM_Only' | 'Digital';
    
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    
    // GeoJSON format for MongoDB Spatial Queries
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };

    contactInfo: {
        email: string;
        phone: string;
        fax?: string;
    };

    managerId?: Types.ObjectId; 
    
    operationalHours: Array<{
        day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
        isOpen: boolean;
        openTime?: string; 
        closeTime?: string; 
    }>;

    currentStatus: 'Active' | 'Maintenance' | 'Temporarily_Closed' | 'Permanently_Closed';
    
    metadata?: {
        vaultCapacity?: Types.Decimal128;
        lastInspectionDate?: Date;
        openedOn?: Date;
    };

    statusHistory: Array<{
        state: 'Active' | 'Maintenance' | 'Temporarily_Closed' | 'Permanently_Closed';
        updatedBy?: Types.ObjectId; 
        reason?: string;
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

// 2. Define the Schema
const BranchSchema = new Schema<IBranch>({
    branchCode: { 
        type: String, 
        unique: true, 
        required: true,
        immutable: true, // Branch codes shouldn't change once assigned
        uppercase: true,
        trim: true
    },
    branchName: { 
        type: String, 
        required: true,
        trim: true 
    },
    branchType: { 
        type: String, 
        enum: ['Main', 'Mini', 'ATM_Only', 'Digital'],
        default: 'Main'
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    // Standard GeoJSON implementation
    location: {
        type: { 
            type: String, 
            enum: ['Point'], 
            required: function(this: IBranch) { return !!this.location?.coordinates; } 
        },
        coordinates: { 
            type: [Number], // [longitude, latitude] MUST be this order in MongoDB
            required: function(this: IBranch) { return !!this.location?.type; }
        }
    },
    contactInfo: {
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, required: true, trim: true },
        fax: { type: String, trim: true }
    },
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
        // Note: Removed `required: true` because 'ATM_Only' or 'Digital' branches may not have a physical manager.
    },
    operationalHours: [{
        day: { 
            type: String, 
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        isOpen: { type: Boolean, default: true },
        // Regex validation to ensure strict HH:mm format
        openTime: { 
            type: String, 
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use a valid HH:mm format'] 
        },
        closeTime: { 
            type: String, 
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use a valid HH:mm format'] 
        }
    }],
    currentStatus: { 
        type: String, 
        enum: ['Active', 'Maintenance', 'Temporarily_Closed', 'Permanently_Closed'], 
        default: 'Active',
        index: true
    },
    metadata: {
        vaultCapacity: { type: Schema.Types.Decimal128 },
        lastInspectionDate: { type: Date },
        openedOn: { type: Date, default: Date.now, immutable: true }
    },
    statusHistory: [{
        state: { 
            type: String, 
            enum: ['Active', 'Maintenance', 'Temporarily_Closed', 'Permanently_Closed'],
            required: true
        },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    optimisticConcurrency: true // Prevents conflicts if two regional admins edit the branch simultaneously
});

// --- Validation & Middleware ---

// Automatically track status history
BranchSchema.pre('save', async function() {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: this.statusHistory[this.statusHistory.length - 1]?.updatedBy, 
            updatedAt: new Date()
        });
    }
});

// Cross-field Validation
BranchSchema.pre('validate', async function() {
    if (this.branchType === 'ATM_Only' && this.metadata?.vaultCapacity == null) {
        // ATM-specific validation rules can be added here
    }
});

// --- Indexes ---

// 1. Geospatial Index: CRITICAL for "Find nearest branch" map features
BranchSchema.index({ location: "2dsphere" });

// 2. Compound Index: Faster UI filtering (e.g., "Show Active branches in Mumbai")
BranchSchema.index({ "address.city": 1, currentStatus: 1 });
BranchSchema.index({ "address.state": 1, currentStatus: 1 });

// Note: Removed the `branchCode` index since `unique: true` already creates one.

export default mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);