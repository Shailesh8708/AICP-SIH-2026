// server/src/services/opportunity/adapters/genericHtmlAdapter.js
import { BaseAdapter } from './baseAdapter.js'

export class GenericHtmlAdapter extends BaseAdapter {
  constructor() {
    super('generic_html')
  }

  async fetch(_source) {
    return []
  }
}

export default new GenericHtmlAdapter()
