import Swap from '../components/swapComponent'
import Layout from '../components/layout'
import LayerSwapApiClient from '../lib/layerSwapApiClient'
import { InferGetServerSidePropsType } from 'next'
import { SettingsProvider } from '../context/settings'
import { LayerSwapSettings } from '../Models/LayerSwapSettings'
import MaintananceContent from '../components/maintanance/maintanance'
import LayerSwapAuthApiClient from '../lib/userAuthApiClient'
import { validateSignature } from '../helpers/validateSignature'
import { mapNetworkCurrencies } from '../helpers/settingsHelper'
import RainbowKit from '../components/Wizard/Steps/Wallet/RainbowKit'

type IndexProps = {
  settings?: LayerSwapSettings,
  inMaintanance: boolean,
  validSignatureisPresent?: boolean,
}

export default function rainbow({ settings, inMaintanance }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout>
      <RainbowKit />
    </Layout>
  )
}

export async function getServerSideProps(context) {

  const validSignatureIsPresent = validateSignature(context.query)

  let result: IndexProps = {
    inMaintanance: false,
  };

  context.res.setHeader(
    'Cache-Control',
    's-maxage=60, stale-while-revalidate'
  );

  var apiClient = new LayerSwapApiClient();
  const { data: settings } = await apiClient.GetSettingsAsync()

  settings.networks = settings.networks.filter(n => n.status !== "inactive");
  settings.exchanges = mapNetworkCurrencies(settings.exchanges.filter(e => e.status === 'active'), settings.networks)


  const resource_storage_url = settings.discovery.resource_storage_url
  if (resource_storage_url[resource_storage_url.length - 1] === "/")
    settings.discovery.resource_storage_url = resource_storage_url.slice(0, -1)

  result.settings = settings;
  result.settings.validSignatureisPresent = validSignatureIsPresent;
  if (!result.settings.networks.some(x => x.status === "active") || process.env.IN_MAINTANANCE == 'true') {
    result.inMaintanance = true;
  }

  return {
    props: result,
  }
}