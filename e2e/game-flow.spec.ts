import { test, expect } from "@playwright/test";

test("two players can join and play a turn", async ({ browser }) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  const hostPage = await host.newPage();
  const guestPage = await guest.newPage();

  // Host creates a room
  await hostPage.goto("/");
  await hostPage.getByText("Crear sala").click();
  await hostPage.waitForURL(/\/juego\//);
  const url = hostPage.url();

  // Guest joins
  await guestPage.goto(url);
  await guestPage.getByPlaceholder("Tu nombre").fill("Guest");
  await guestPage.getByText("Unirme").click();

  // Both should see 2 players in the seat grid
  await expect(hostPage.getByText("Anfitrión")).toBeVisible();
  await expect(hostPage.getByText("Guest")).toBeVisible();
  await expect(guestPage.getByText("Anfitrión")).toBeVisible();
  await expect(guestPage.getByText("Guest")).toBeVisible();
});
