import crypto from 'crypto';

export const config = {
  app_id: "553",
  key1: "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q",
  key2: "Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

export function createMac(data: string) {
  return crypto.createHmac('sha256', config.key1).update(data).digest('hex');
}

export function verifyCallbackMac(dataStr: string, requestMac: string) {
  const mac = crypto.createHmac('sha256', config.key2).update(dataStr).digest('hex');
  return mac === requestMac;
}
