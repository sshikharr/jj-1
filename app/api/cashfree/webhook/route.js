import { NextResponse } from "next/server";
import connectDB from "../../../../lib/connectDB/db";
import User from "../../../../lib/db/models/User";

export async function POST(req) {
    const data = await req.json();
  console.log("Webhook: Received data", data);
  try {
    console.log("Webhook: Request received");
    await connectDB();

    console.log("Webhook: Received data", data);

    if (data.data.payment.payment_status === "SUCCESS") {
      console.log("Webhook: Payment successful");
      const userId = data.customer_details?.customer_id;
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          // Update user plan based on payment_amount
          if (data.data.payment.payment_amount && data.data.payment.payment_amount == 199) {
            user.plan = "super";
          } else if (data.data.payment.payment_amount && data.data.payment.payment_amount == 399) {
            user.plan = "advance";
          }
          await user.save();
          console.log("Webhook: Updated user plan to", user.plan);
        } else {
          console.log("Webhook: User not found with id", userId);
        }
      } else {
        console.log("Webhook: No user id in customer_details");
      }
    } else {
      console.log("Webhook: Payment not successful, status:", data.data.payment.payment_status);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
