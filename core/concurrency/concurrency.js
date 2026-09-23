import pLimit from 'p-limit';

export const mapLimit = (items, mapper, { concurrency = 8 } = {}) => {
  const limit = pLimit(concurrency);
  return Promise.all(items.map((item, index) => limit(() => mapper(item, index))));
};

export const mapLimitSettled = (items, mapper, { concurrency = 8 } = {}) => {
  const limit = pLimit(concurrency);
  return Promise.allSettled(items.map((item, index) => limit(() => mapper(item, index))));
};
