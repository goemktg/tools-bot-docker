import { SeatHanlder } from "../library/classes/SeatHandler";
import "../library/loadEnvironmentVariables";

const deliveryPerAcceptors = new Map<string, deliveryInfo>();
const deliveryPerMonth = new Map<string, deliveryInfo>();

// set time range
const startDate = new Date("2023-01-01T00:00:00Z");
const endDate = new Date("2025-01-31T23:59:59Z");

void getContracts();

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

      // skip if not in time range
      const dateCompletedString =
        contract.date_completed.replace(" ", "T") + "Z";
      const dateCompleted = new Date(dateCompletedString);
      if (dateCompleted < startDate || dateCompleted > endDate) continue;

      const dateYYMM = contract.date_completed.slice(2, 7);
      safeAdd(deliveryPerAcceptors, contract.acceptor.name, contract.volume);
      safeAdd(deliveryPerMonth, dateYYMM, contract.volume);
    }
    console.log(deliveryPerAcceptors);
    console.log(deliveryPerMonth);
  }
}

function safeAdd(
  data: Map<string, deliveryInfo>,
  name: string,
  volume: number,
) {
  let deliveryInfo = data.get(name);

  if (deliveryInfo === undefined) {
    deliveryInfo = {
      totalDeliveryCount: 0,
      totalDeliveryVolume: 0,
    };
  }

  deliveryInfo.totalDeliveryCount += 1;
  deliveryInfo.totalDeliveryVolume += volume;

  data.set(name, deliveryInfo);
}

interface deliveryInfo {
  totalDeliveryCount: number;
  totalDeliveryVolume: number;
}
