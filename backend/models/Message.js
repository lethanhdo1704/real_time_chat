import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { 
      type: String, 
      required: true,
      index: true
    },    
    receiver: { 
      type: String, 
      required: true,
      index: true
    },
    text: { 
      type: String, 
      required: true 
    },
    read: { 
      type: Boolean, 
      default: false,
      index: true
    }
  }, 
  { 
    timestamps: true
  }
);

// Compound indexes for performance
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });
MessageSchema.index({ sender: 1, receiver: 1, read: 1 });

export default mongoose.model("Message", MessageSchema);