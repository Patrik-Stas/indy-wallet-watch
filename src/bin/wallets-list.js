#!/usr/bin/env node

import { listWallets } from '../indy-utils'

async function run () {
  const wallets = await listWallets()
  console.log(wallets)
}

run()
