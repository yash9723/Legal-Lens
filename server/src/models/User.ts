import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    plan: 'Free' | 'Starter' | 'Professional' | 'Team';
    role: 'user' | 'admin';
    joinedDate: Date;
    documentsAnalyzed: number;
    avatarUrl?: string;
    googleId?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    twoFactorSecret?: string;
    isTwoFactorEnabled?: boolean;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    plan: { type: String, enum: ['Free', 'Starter', 'Professional', 'Team'], default: 'Free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    joinedDate: { type: Date, default: Date.now },
    documentsAnalyzed: { type: Number, default: 0 },
    avatarUrl: { type: String },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    twoFactorSecret: { type: String },
    isTwoFactorEnabled: { type: Boolean, default: false },
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
