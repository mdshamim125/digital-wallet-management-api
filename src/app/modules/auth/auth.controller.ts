import { catchAsync } from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { AuthServices } from "./auth.service";

const credentialsLogin = catchAsync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body);

    // // res.cookie("accessToken", loginInfo.accessToken, {
    // //     httpOnly: true,
    // //     secure: false
    // // })

    // // res.cookie("refreshToken", loginInfo.refreshToken, {
    // //     httpOnly: true,
    // //     secure: false,
    // // })

    setAuthCookie(res, loginInfo);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged In Successfully",
      data: loginInfo,
    });
  }
);

export const AuthControllers = {
  credentialsLogin,
};
