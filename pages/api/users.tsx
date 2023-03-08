import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../util/db";
import crypto from "crypto";
import User from "../../models/user";
import parseCookie from "../../util/parseCookie";

/* POST - Creates a new user and requires a request body containing an email, password, and username field
 * DELETE - Deletes the user permanently. Requires the token that should be sent as a cookie
 * There is not GET function. That is handled via the getUser(context) util function
 */

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Connect to the "users" collection on the database
  const client = await clientPromise;
  const db = client.db(process.env.DB);
  const users = db.collection("users");

  let username = "";
  let password = "";
  let token = "";

  switch (req.method) {
    /* -------------------- GET ------------------------ */
    case "GET":
      /* Getting the user should primarily be done via the util function `getUser(context)`
       to be able to retrieve the user object with Next.js pages and automatically reroute
       to the login page when the user isn't logged in */

      // Extract authentication token from header
      token = typeof req.headers.token === "string" ? req.headers.token : "";
      // If no token, 400: Bad request
      if (!token) {
        res.status(400).json({ error: true, data: "bad request" });
        break;
      }

      // Attempt to find user via token
      let user = await users.findOne({ token: token });
      // If no user found, 404: not found
      if (!user) {
        res.status(404).json({ error: true, data: "user not found with that token" });
        break;
      }

      // else, send the user back
      res.status(200).json({ error: false, data: user });
      break;
    /* -------------------- POST ------------------------ */
    // Create new user only if using a POST request
    case "POST":
      username = req.body.user;
      const email = req.body.email;
      password = req.body.pass;

      // Check to see if user already exists (username or email)
      const userExists = await users.findOne({ username: username });
      if (userExists) {
        // 409: CONFLICT
        res.status(409).redirect("/sign-up?error=Username-already-in-use");
        break;
      }
      const emailExists = await users.findOne({ email: email });
      if (emailExists) {
        // 409: CONFLICT
        res.status(409).redirect("/sign-up?error=Email-already-in-use");
        break;
      }

      // Hash the password for storage on the database
      let hashPassword = crypto.createHash("sha256").update(password).digest("hex");

      // create a user object and post it to the database
      const newUser = {
        username: username,
        email: email,
        password: hashPassword,
        created: new Date(),
        verified: false
      }

      users.insertOne(newUser);

      // 201: CREATED
      res.status(201).redirect("/login");
      break;
    /* -------------------- DELETE ------------------------ */
    case "DELETE":
      // Extract authorization token from cookies
      const cookie = req.headers.cookie || "";
      const parsedCookies = parseCookie(cookie);
      token = parsedCookies.token;

      // If the token exists
      if (token) {
        const user = await users.findOne({ token: token });
        if (!user) {
          res.status(500).json({ error: true, data: "user not found" })
          break;
        }

        const deleted = await users.deleteOne({ _id: user._id });
        if (deleted.deletedCount > 0) {
          // If the user has been deleted, delete all owned recipes and send back status 200
          const recipes = db.collection("recipes");
          recipes.deleteMany({ owner: user.username });
          res.status(200).json({ success: true });
          break;
        } else {
          // If nothing was deleted, status 500: Internal server error
          res.status(500).json({ success: false });
          break;
        }
      } else {
        // If no token is found, error 401: Unauthorized
        res.status(401).json({ sucess: false });
        break;
      }
    default:
      // 405: METHOD NOT ALLOWED
      res.status(405).redirect("/");
  }
}

export default handler;