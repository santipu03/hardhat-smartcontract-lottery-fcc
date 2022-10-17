const { assert, expect } = require("chai")
const { getNamedAccounts, network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle, deployer, raffleEntranceFee

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  const startingTimestamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      // we set up listener first
                      raffle.once("WinnerPicked", async () => {
                          console.log("Event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimestamp = await raffle.getLastTimeStamp()
                              const winnerEndingBalance = await accounts[0].getBalance()

                              assert(endingTimestamp > startingTimestamp)
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(
                                  winnerEndingBalance,
                                  winnerStartingBalance.toString().add(raffleEntranceFee.toString())
                              )

                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })

                      // Then, we enter the Raffle
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
