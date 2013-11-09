module.exports = 
  { "development":
    { "driver":   "memory"
    }
  , "test":
    { "driver":   "memory"
    }
  , "production":
    { "driver":   "redis-hq",
    "database": 2,
    "host": "162.243.60.106"
    }
  };
