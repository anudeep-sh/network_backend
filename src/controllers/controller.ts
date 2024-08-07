import { INetwork } from "../types/types";
import { v4 as uuidv4 } from "uuid";
const bcrypt = require("bcrypt");
import knex from "../database/db";
import * as jwt from "jsonwebtoken";
import { Status, Type, WITHDRAWAL_STATUS } from "../models/types";
import { generateUniqueId } from "../utilities/helper";

export class NetworkController implements INetwork {
  registerController = async (ctx: any) => {
    try {
      const { username, email, password } = ctx.request.body;
      const id = uuidv4();
      const tenDigitCode = generateUniqueId();
      const hash = await bcrypt.hash(password, 10);

      const newUser = await knex("users")
        .insert({
          id,
          name: username.toLowerCase(),
          emailId: email.toLowerCase(),
          password: hash,
          status: Status.ACTIVE,
          shortcode: tenDigitCode,
        })
        .returning("*");

      const wallet = await knex("wallet_history")
        .insert({ id: uuidv4(), user_id: id, amount: 0.0, type: Type.CREDIT })
        .returning("*");

      // Generate JWT token
      newUser[0].password = "";
      const token = jwt.sign({ userPayload: newUser[0] }, "SAI_RAM", {
        expiresIn: "24h", // Set the token expiration time
      });
      ctx.body = { user: newUser[0], token, wallet: wallet[0] };
    } catch (err: any) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  loginController = async (ctx: any) => {
    try {
      const { email, password } = ctx.request.body;

      const user = await knex("users")
        .where({ emailId: email.toLowerCase() })
        .returning("*");
      if (user.length == 0) {
        ctx.body = "Invalid email or password";
        ctx.status = 401;
        return;
      }

      if (!(await bcrypt.compare(password, user[0].password))) {
        ctx.body = "Invalid email or password";
        ctx.status = 401;
        return;
      }
      user[0].password = "";

      // Generate JWT token
      const token = jwt.sign({ userPayload: user[0] }, "SAI_RAM", {
        expiresIn: "24h", // Set the token expiration time
      });
      ctx.body = { user, token };
    } catch (err: any) {
      console.error(err);
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  networkController = async (ctx: any) => {
    try {
      const users = await knex("users").select(
        "id",
        "name",
        "emailId",
        "shortcode"
      ).returning("*");
      const network = await knex("network").select("user_id", "referrer_id").returning("*");

      const userMap = new Map();
      users.forEach((user) => {
        userMap.set(user.id, { ...user, children: [] });
      });

      network.forEach((connection) => {
        const user = userMap.get(connection.user_id);
        const referrer = userMap.get(connection.referrer_id);
        if (referrer) {
          referrer.children.push(user);
        }
      });

      const rootNodes: any = [];
      userMap.forEach((user) => {
        if (!network.some((connection) => connection.user_id === user.id)) {
          rootNodes.push(user);
        }
      });

      ctx.body = { data: rootNodes };
    } catch (err: any) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  getWalletDetails = async (ctx: any) => {
    try {
      const userDetails = ctx.state.userPayload;

      // Fetch the wallet details for the authenticated user
      const wallet = await knex("wallet_history")
        .where({ user_id: userDetails.id })
        .returning("*");

      if (!wallet) {
        ctx.body = "Wallet not found";
        ctx.status = 404;
        return;
      }
      const walletValue = wallet[0];
      const finalPrice = wallet.reduce((accumulator: number, curvalue: any) => {
        if (curvalue.type === "CREDIT") {
          console.log(parseInt(curvalue.amount) + accumulator, "INSIDE");
          return parseInt(curvalue.amount) + accumulator;
        } else {
          return accumulator - parseInt(curvalue.amount);
        }
      }, 0);
      walletValue.amount = finalPrice;
      ctx.body = { wallet: walletValue };
    } catch (err: any) {
      console.error(err);
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  getWalletHistoryDetails = async (ctx: any) => {
    try {
      const userDetails = ctx.state.userPayload;

      // Fetch the wallet details for the authenticated user
      const wallet = await knex("wallet_history")
        .where({ user_id: userDetails.id })
        .returning("*");

      if (!wallet) {
        ctx.body = "Wallet not found";
        ctx.status = 404;
        return;
      }
      ctx.body = { data: wallet };
    } catch (err: any) {
      console.error(err);
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  joinController = async (ctx: any) => {
    try {
      const referralPayload = ctx.state.userPayload;
      const { shortcode, level } = ctx.request.body;

      if (referralPayload.emailId === "anudeep4n@gmail.com") {
        const id = uuidv4();
        const userDetails = await knex("users")
          .where({ shortcode: shortcode })
          .returning("*");
        if (userDetails.length == 0) {
          (ctx.body = "NO_USER_EXIST_WITH_THAT_STATUS_CODE"),
            (ctx.status = 400);
          return;
        }
        const hubDetails = await knex("hub")
          .where({ level: level })
          .returning("*");
        if (hubDetails.length == 0) {
          (ctx.body = "NOT_CORRECT_LEVEL"), (ctx.status = 400);
          return;
        }
        const membershipDetails = await knex("network")
          .insert({
            id,
            user_id: userDetails[0].id,
            referrer_id: referralPayload.id,
            hub_id: hubDetails[0].id,
            type: Type.CREDIT,
          })
          .returning("*");
        const walletUniqueId = uuidv4();
        const wallet = await knex("wallet_history")
          .insert({
            id: walletUniqueId,
            user_id: referralPayload.id,
            amount: parseInt(hubDetails[0].price),
            type: Type.CREDIT,
          })
          .returning("*");
        ctx.body = { membershipDetails: "Successfully referred" };
        ctx.status = 201;
      } else {
        const fetchUserNetworkDetails = await knex("network")
          .where({ user_id: referralPayload.id })
          .returning("*");
        if (fetchUserNetworkDetails.length == 0) {
          (ctx.body = "YOU_DO_NOT_HAVE_ANY_SUBSCRIPTION"), (ctx.status = 400);
          return;
        }
        const referralDetails = await knex("network")
          .select(
            "network.id",
            "network.type",
            "network.timestamp",
            "hub.name as hub_name",
            "hub.level",
            "hub.price"
          )
          .leftJoin("hub", "network.hub_id", "hub.id")
          .where("network.user_id", referralPayload.id);
        if (referralDetails.length === 0) {
          (ctx.body = "SOMETHING_WENT_WRONG_PLEASE_RE_LOGIN_BY_REMOVING_CACHE"),
            (ctx.status = 400);
          return;
        }
        if (level < referralDetails[0].level) {
          (ctx.body = "PLEASE_UPDATE_YOUR_SUBSCRIPTION"), (ctx.status = 400);
          return;
        }
        const id = uuidv4();
        const userDetails = await knex("users")
          .where({ shortcode: shortcode })
          .returning("*");
        if (userDetails.length == 0) {
          (ctx.body = "NO_USER_EXIST_WITH_THAT_STATUS_CODE"),
            (ctx.status = 400);
          return;
        }
        const hubDetails = await knex("hub")
          .where({ level: level })
          .returning("*");
        if (hubDetails.length == 0) {
          (ctx.body = "NOT_CORRECT_LEVEL"), (ctx.status = 400);
          return;
        }
        const membershipDetails = await knex("network").insert({
          id,
          user_id: userDetails[0].id,
          referrer_id: referralPayload.id,
          hub_id: hubDetails[0].id,
          type: Type.CREDIT,
        });

        await this.updateWalletDetails(userDetails, hubDetails[0]?.price);

        ctx.body = { membershipDetails: membershipDetails[0] };
        ctx.status = 201;
      }
    } catch (err: any) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  addHUBController = async (ctx: any) => {
    try {
      const id = uuidv4();
      const { level, name, price } = ctx.request.body;
      const newLevel = await knex("hub")
        .insert({
          id,
          name,
          level,
          price,
        })
        .returning("*");

      ctx.body = { level: newLevel[0] };
    } catch (err: any) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  getLevelsController = async (ctx: any) => {
    try {
      const levels = await knex("hub").select("*");
      ctx.body = { levels };
    } catch (err: any) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  withdrawalController = async (ctx: any) => {
    try {
      const walletValue = await this.walletMoney(ctx);
      const { withdrawal_amount } = ctx.request.body;
      if (walletValue < withdrawal_amount) {
        (ctx.body = "your asking more than in wallet we can not process this"),
          (ctx.status = 400);
        return;
      }
      const id = uuidv4();
      const userPayload = ctx.state.userPayload;
      const withdrawalResponse = await knex("withdrawals")
        .insert({
          id,
          user_id: userPayload.id,
          amount: withdrawal_amount,
          status: WITHDRAWAL_STATUS.PENDING,
        })
        .returning("*");
      ctx.status = 201;
      ctx.body = { data: withdrawalResponse[0] };
    } catch (err) {
      ctx.body = "Internal Server Error";
      ctx.status = 500;
    }
  };

  updateWithDrawalRequest = async (ctx: any) => {
    try {
      const { status, withdrawalId } = ctx.request.body;
      const withdrawalResponse = await knex("withdrawals")
        .where({ id: withdrawalId })
        .returning("*");
      ctx.state.userPayload.id = withdrawalResponse[0]?.user_id;
      const walletValue = await this.walletMoney(ctx);

      if (walletValue < withdrawalResponse[0]?.amount) {
        (ctx.body = "your asking more than in wallet we can not process this"),
          (ctx.status = 400);
        return;
      }
      const updateWithdrawalResponse = await knex("withdrawals")
        .update({ status: status })
        .where({ id: withdrawalId })
        .returning("*");
      if (status === WITHDRAWAL_STATUS.APPROVED) {
        await knex("wallet_history").insert({
          id: uuidv4(),
          user_id: ctx.state.userPayload.id,
          amount: withdrawalResponse[0].amount,
          type: Type.WITHDRAWAL,
        });
      }
      ctx.status = 200;
      ctx.body = {
        data: updateWithdrawalResponse,
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  };

  withdrawalList = async (ctx: any) => {
    try {
      const status = ctx.params.status;
      const withDrawalResponse = await knex("withdrawals")
        .select("*")
        .where({ status });
      ctx.body = { data: withDrawalResponse };
      ctx.status = 200;
    } catch (err) {
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  };

  walletMoney = async (ctx: any) => {
    const userDetails = ctx.state.userPayload;

    // Fetch the wallet details for the authenticated user
    const wallet = await knex("wallet_history")
      .where({ user_id: userDetails.id })
      .returning("*");

    if (!wallet) {
      ctx.body = "Wallet not found";
      ctx.status = 404;
      return;
    }
    const finalPrice = wallet.reduce((accumulator: number, curvalue: any) => {
      if (curvalue.type === "CREDIT") {
        return parseInt(curvalue.amount) + accumulator;
      } else {
        accumulator - parseInt(curvalue.amount);
      }
    }, 0);
    return finalPrice;
  };
  updateWalletDetails = async (userDetails: any, price: number) => {
    const distribution = [
      { level: 1, percentage: 25 },
      { level: 2, percentage: 10 },
      { level: 3, percentage: 5 },
      { level: 4, percentage: 2.5 },
    ];
    let finallyCompanywallet = price;
    let userDetailId = userDetails[0].id;
    for (let i = 0; i < 4; i++) {
      const walletUserId = await knex("network")
        .select("*")
        .where({ user_id: userDetailId });
      if (walletUserId.length === 0) {
        break;
      }
      const amountToTransfer = (price * distribution[i].percentage) / 100;
      finallyCompanywallet = finallyCompanywallet - amountToTransfer;
      userDetailId = walletUserId[0]?.referrer_id;
      const wallet = await knex("wallet_history").insert({
        id: uuidv4(),
        user_id: walletUserId[0]?.referrer_id,
        amount: amountToTransfer,
        type: Type.CREDIT,
      });
    }
    const adminDetails = await knex("users")
      .where({ emailId: "anudeep4n@gmail.com" })
      .returning("*");
    await knex("wallet_history").insert({
      id: uuidv4(),
      user_id: adminDetails[0]?.id,
      amount: finallyCompanywallet,
      type: Type.CREDIT,
    });
  };
}
