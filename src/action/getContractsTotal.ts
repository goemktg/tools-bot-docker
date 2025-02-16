import { SeatHanlder } from "../library/classes/SeatHandler";
import "../library/loadEnvironmentVariables";

void getContracts();

const deliveryInfo = {
  totalDeliveryCount: 0,
  totalDeliveryVolume: 0,
};

async function getContracts() {
  let lastPage = 999; // not important, will be overwritten
  let page = 1;

  while (page <= lastPage) {
    console.log(`processing page: ${page} / ${lastPage}`);
    const SeatHandler = new SeatHanlder();
    const contracts = await SeatHandler.getCorpContracts(98663436, page);
    lastPage = contracts.meta.last_page;
    page += 1;

    for (const contract of contracts.data) {
      // skip if not courier or not finished
      if (contract.type !== "courier" || contract.status !== "finished")
        continue;

      deliveryInfo.totalDeliveryCount += 1;
      deliveryInfo.totalDeliveryVolume += contract.volume;
    }
    console.log(deliveryInfo);
  }
}
