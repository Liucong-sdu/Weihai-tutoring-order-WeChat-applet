const axios = require('axios');

class WeChatUtils {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.baseURL = 'https://api.weixin.qq.com';
  }

  async getSession(code) {
    try {
      const response = await axios.get(`${this.baseURL}/sns/jscode2session`, {
        params: {
          appid: this.appId,
          secret: this.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      const { openid, session_key, errcode, errmsg } = response.data;

      if (errcode) {
        throw new Error(`微信登录失败: ${errmsg}`);
      }

      return { openid, session_key };
    } catch (error) {
      console.error('微信登录错误:', error);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      const response = await axios.get(`${this.baseURL}/cgi-bin/token`, {
        params: {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret
        }
      });

      const { access_token, expires_in, errcode, errmsg } = response.data;

      if (errcode) {
        throw new Error(`获取access_token失败: ${errmsg}`);
      }

      return { access_token, expires_in };
    } catch (error) {
      console.error('获取access_token错误:', error);
      throw error;
    }
  }
}

module.exports = new WeChatUtils();