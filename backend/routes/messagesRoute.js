router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }); // cũ -> mới
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
