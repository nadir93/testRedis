if redis.call('exists', KEYS[1]) == 1 then
  return {1, redis.call('expire', KEYS[1], ARGV[3])} -- scenario #1
else
  local activeq_size = redis.call('scard', KEYS[2])
  local waitingq_size = redis.call('zcard', KEYS[3])
  if activeq_size < tonumber(ARGV[1]) and  waitingq_size < 1 then
    return {2, redis.call('setex', KEYS[1], ARGV[3], ARGV[4]), -- scenario #2
            redis.call('sadd', KEYS[2], ARGV[2])}
  else
    if redis.call('exists', KEYS[4]) == 1 then
      return {3, redis.call('expire', KEYS[4], ARGV[3]),  -- scenario #3
              redis.call('zrank', KEYS[3], ARGV[2]), waitingq_size}
    else
      return {4, redis.call('setex', KEYS[4], ARGV[3], ARGV[4]), -- scenario #4
              redis.call('zadd', KEYS[3], 2000000000 - redis.call('ttl', 'future'), ARGV[2]),
              waitingq_size + 1,
              waitingq_size + 1}
    end
  end
end
