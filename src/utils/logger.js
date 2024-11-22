import winston from "winston"; // Import the winston library

// Create a custom logger
const logger = winston.createLogger({
  level: "info", // Default log level, you can change to 'debug' or 'error' for more verbosity
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Timestamp for each log
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`; // Custom log format
    })
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }), // Log to console
    new winston.transports.File({ filename: "logs/bot.log" }), // Log to file (logs/bot.log)
  ],
});

// Custom log methods for different levels
export const logInfo = (message) => {
  logger.info(message);
};

export const logError = (message) => {
  logger.error(message);
};

export const logDebug = (message) => {
  if (process.env.NODE_ENV === "development") {
    logger.debug(message); // Only log debug messages in the development environment
  }
};
