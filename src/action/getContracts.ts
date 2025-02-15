import { SeatHanlder } from "../library/classes/SeatHandler";
import "../library/loadEnvironmentVariables";

const acceptors = new Map<string, acceptorInfo>();

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
      if (contract.type !== "courier" || contract.status !== "finished")
        continue;

      const dateCompletedString =
        contract.date_completed.replace(" ", "T") + "Z";
      const dateCompleted = new Date(dateCompletedString);
      if (dateCompleted < startDate || dateCompleted > endDate) continue;

      safeAdd(contract.acceptor.name, contract.volume);
    }
    console.log(acceptors);
  }
}

function safeAdd(acceptorName: string, deliveryVolume: number) {
  let acceptorInfo = acceptors.get(acceptorName);

  if (acceptorInfo === undefined) {
    acceptorInfo = {
      totalDeliveryCount: 0,
      totalDeliveryVolume: 0,
    };
  }

  acceptorInfo.totalDeliveryCount += 1;
  acceptorInfo.totalDeliveryVolume += deliveryVolume;

  acceptors.set(acceptorName, acceptorInfo);
}

interface acceptorInfo {
  totalDeliveryCount: number;
  totalDeliveryVolume: number;
}
