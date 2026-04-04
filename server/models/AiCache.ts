import mongoose, { Schema, Document } from 'mongoose';

export interface IAiCache extends Document {
  cacheKey: string;
  agentType: string;
  response: any;
  createdAt: Date;
}

const AiCacheSchema = new Schema<IAiCache>({
  cacheKey: { type: String, required: true, unique: true },
  agentType: { type: String, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index to automatically expire documents after 86400 seconds (24 hours)
AiCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const AiCache = mongoose.models.AiCache || mongoose.model<IAiCache>('AiCache', AiCacheSchema);
