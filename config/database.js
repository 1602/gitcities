module.exports = 
  { "development":
    { "driver":   "redis-hq",
    "database": 1
    }
  , "test":
    { "driver":   "redis-hq",
    "database": 2
  }
  , "production":
    { "driver":   "redis-hq",
    "database": 3
    }
  };
