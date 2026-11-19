export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === "P2002") return res.status(409).json({ message: "A record with that value already exists." });
  if (error.code === "P2025") return res.status(404).json({ message: "The requested record was not found." });
  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
}
