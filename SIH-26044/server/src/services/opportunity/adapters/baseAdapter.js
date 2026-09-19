// server/src/services/opportunity/adapters/baseAdapter.js
// Base Adapter for Official Company Career Sources

import axios from 'axios'

export class BaseAdapter {
  constructor(name = 'base') {
    this.name = name
    this.timeout = 15000 // 15s timeout
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AICP-OpportunityRadar/1.0',
      'Accept': 'application/json, text/plain, */*',
    }
  }

  async fetch(_source) {
    throw new Error(`fetch() must be implemented by adapter ${this.name}`)
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: { ...this.headers, ...(options.headers || {}) },
        timeout: options.timeout || this.timeout,
        params: options.params,
        data: options.data,
      })
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Request failed'
      const status = error.response?.status
      throw new Error(`[Adapter ${this.name}] ${status ? `HTTP ${status}: ` : ''}${message}`)
    }
  }
}
