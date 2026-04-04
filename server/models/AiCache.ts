import mongoose, { Schema, Document } from 'mongoose';

export interface IAiCache extends Document {
  cacheKey: string;
  agentType: string;
  response: any;
  version: number;
  createdAt: Date;
}

const AiCacheSchema = new Schema<IAiCache>({
  cacheKey: { type: String, required: true },
  agentType: { type: String, required: true, enum: ['teacher', 'student', 'adaptive'] },
  response: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

// Compound unique index on cacheKey + agentType for partitioned lookups
AiCacheSchema.index({ cacheKey: 1, agentType: 1 }, { unique: true });

// TTL index to automatically expire documents after 24 hours
AiCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const AiCache = mongoose.models.AiCache || mongoose.model<IAiCache>('AiCache', AiCacheSchema);
