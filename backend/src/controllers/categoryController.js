const discordService = require('../services/discordService');

class CategoryController {
  /**
   * List all categories
   */
  async list(req, res) {
    try {
      const categories = await discordService.getCategories(req.guildId);
      return res.json({ categories });
    } catch (err) {
      console.error('[CategoryController list Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Create category
   */
  async create(req, res) {
    try {
      const { name, position } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const category = await discordService.createCategory(
        req.guildId,
        {
          name: name.trim(),
          position: position !== undefined ? parseInt(position, 10) : undefined,
        },
        req.user
      );

      return res.status(201).json({
        category: {
          id: category.id,
          name: category.name,
          position: category.position,
        },
      });
    } catch (err) {
      console.error('[CategoryController create Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Edit category
   */
  async edit(req, res) {
    try {
      const { categoryId } = req.params;
      const { name, position } = req.body;

      const category = await discordService.editCategory(
        req.guildId,
        categoryId,
        {
          name: name ? name.trim() : undefined,
          position: position !== undefined ? parseInt(position, 10) : undefined,
        },
        req.user
      );

      return res.json({
        category: {
          id: category.id,
          name: category.name,
          position: category.position,
        },
      });
    } catch (err) {
      console.error('[CategoryController edit Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete category
   */
  async delete(req, res) {
    try {
      const { categoryId } = req.params;
      const deleteChannels = req.query.deleteChannels !== 'false' && req.body?.deleteChannels !== false;
      const result = await discordService.deleteCategory(req.guildId, categoryId, req.user, deleteChannels);
      return res.json(result);
    } catch (err) {
      console.error('[CategoryController delete Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Move category position
   */
  async move(req, res) {
    try {
      const { categoryId } = req.params;
      const { position } = req.body;

      if (position === undefined) {
        return res.status(400).json({ error: 'Position is required' });
      }

      const category = await discordService.editCategory(
        req.guildId,
        categoryId,
        { position: parseInt(position, 10) },
        req.user
      );

      return res.json({
        category: {
          id: category.id,
          name: category.name,
          position: category.position,
        },
      });
    } catch (err) {
      console.error('[CategoryController move Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CategoryController();

