if (redis.call('EXISTS', KEYS[1]) == 1) then
  redis.call("EXPIRE", KEYS[1], 100)
  return 1
else
  if redis.call("SCARD", KEYS[2]) < tonumber(ARGV[1]) then
      redis.call("SETEX", KEYS[1], 100, "123")
      redis.call("SADD", KEYS[2], ARGV[2])
      return 2
  else
      return 3
  end
end
