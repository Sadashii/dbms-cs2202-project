import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    
    email: string;
    isEmailVerified: boolean;
    phone?: string;
    
    currentStatus: 'Active' | 'Suspended' | 'Disabled' | 'Pending_KYC';
    role: 'Customer' | 'Employee' | 'Manager' | 'Admin';

    previousEmails: Array<{ address: string; changedAt: Date }>;
    passwords: Array<{ hash: string; createdAt: Date }>;
    addresses: Array<{
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        isPrimary: boolean;
        updatedAt: Date;
    }>;
    statusHistory: Array<{
        state: 'Active' | 'Suspended' | 'Disabled' | 'Pending_KYC';
        reason?: string;
        updatedAt: Date;
    }>;
    roleHistory: Array<{
        role: 'Customer' | 'Employee' | 'Manager' | 'Admin';
        assignedBy?: Types.ObjectId;
        assignedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    isEmailVerified: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    
    currentStatus: { 
        type: String, 
        enum: ['Active', 'Suspended', 'Disabled', 'Pending_KYC'], 
        default: 'Pending_KYC',
        index: true 
    },
    role: { 
        type: String, 
        enum: ['Customer', 'Employee', 'Manager', 'Admin'], 
        default: 'Customer',
        index: true
    },

    previousEmails: [{
        address: { type: String, lowercase: true, trim: true },
        changedAt: { type: Date, default: Date.now }
    }],
    passwords: {
        type: [{
            hash: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        select: false 
    },
    addresses: [{
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        isPrimary: { type: Boolean, default: false },
        updatedAt: { type: Date, default: Date.now }
    }],
    statusHistory: [{
        state: { type: String, enum: ['Active', 'Suspended', 'Disabled', 'Pending_KYC'] },
        reason: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],
    roleHistory: [{
        role: { type: String, enum: ['Customer', 'Employee', 'Manager', 'Admin'] },
        assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    optimisticConcurrency: true 
});

UserSchema.pre('save', function(next) {
    if (this.isModified('addresses')) {
        const primaryCount = this.addresses.filter(a => a.isPrimary).length;
        if (primaryCount > 1) {
throw new Error('A user can only have one primary address.');        }
    }
    
});

UserSchema.pre('save', function(next) {
    if (this.isModified('passwords') && this.passwords.length > 3) {
        this.passwords = this.passwords.slice(-3);
    }
    
});

UserSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date()
        });
    }
    
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);