export const logger = {
    info: (event, metadata = {}) => {
      console.log(JSON.stringify({ level: "INFO", timestamp: new Date().toISOString(), event, ...metadata }));
    },
    warn: (event, metadata = {}) => {
      console.warn(JSON.stringify({ level: "WARN", timestamp: new Date().toISOString(), event, ...metadata }));
    },
    error: (event, err, metadata = {}) => {
      console.error(
        JSON.stringify({
          level: "ERROR",
          timestamp: new Date().toISOString(),
          event,
          errorMessage: err?.message || err,
          stack: err?.stack,
          ...metadata,
        })
      );
    },
  };