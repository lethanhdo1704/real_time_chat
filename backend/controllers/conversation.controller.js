  // backend/controllers/conversation.controller.js
  import conversationService from "../services/conversation.service.js";

  class ConversationController {
    async createPrivate(req, res) {
      try {
        const { friendUid } = req.body;
        
        if (!friendUid) {
          return res.status(400).json({ message: 'friendUid is required' });
        }
        
        const result = await conversationService.createPrivate(req.user.id, friendUid);
        res.status(201).json(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
    
    async createGroup(req, res) {
      try {
        const { name, memberUids } = req.body;
        
        if (!name || !memberUids) {
          return res.status(400).json({ message: 'name and memberUids are required' });
        }
        
        const result = await conversationService.createGroup(req.user.id, name, memberUids);
        res.status(201).json(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
    
    async getUserConversations(req, res) {
      try {
        const { limit = 20, offset = 0 } = req.query;
        const conversations = await conversationService.getUserConversations(
          req.user.id,
          parseInt(limit),
          parseInt(offset)
        );
        res.json({ conversations });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
    
    async getConversationDetail(req, res) {
      try {
        const detail = await conversationService.getConversationDetail(
          req.conversationId,
          req.user.id
        );
        res.json(detail);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
    
    async leaveGroup(req, res) {
      try {
        const result = await conversationService.leaveGroup(
          req.conversationId,
          req.user.id
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
    
    async addMembers(req, res) {
      try {
        const { memberUids } = req.body;
        
        if (!memberUids || !Array.isArray(memberUids)) {
          return res.status(400).json({ message: 'memberUids array is required' });
        }
        
        const result = await conversationService.addMembers(
          req.conversationId,
          req.user.id,
          memberUids
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
    
    async removeMember(req, res) {
      try {
        const { memberUid } = req.params;
        
        const result = await conversationService.removeMember(
          req.conversationId,
          req.user.id,
          memberUid
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  }

  export default new ConversationController();