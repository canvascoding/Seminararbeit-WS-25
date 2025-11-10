import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const messages = {
    common: (await import("../../content/de/common.json")).default,
    auth: (await import("../../content/de/auth.json")).default,
    checkin: (await import("../../content/de/checkin.json")).default,
    slots: (await import("../../content/de/slots.json")).default,
    partner: (await import("../../content/de/partner.json")).default,
    safety: (await import("../../content/de/safety.json")).default,
    waitingRoom: (await import("../../content/de/waiting-room.json")).default,
  };

  return {
    locale: "de",
    messages,
  };
});
