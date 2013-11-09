module.exports = 
  { "development":
    { "driver":   "redis-hq"
    "database": 3,
    "host": "162.243.60.106"
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
