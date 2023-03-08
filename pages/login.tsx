import { useRouter } from "next/router";
import Input from "../components/input/input";
import Link from "next/link";
import { useState } from "react";
import { useCookies } from "react-cookie";
import crypto from "crypto";

const Login = () => {
  let [cookie, setCookie] = useCookies(["token"])
  let [username, setUsername] = useState("");
  let [usernameValid, setUsernameValid] = useState(true);
  let [password, setPassword] = useState("");
  let [passwordValid, setPasswordValid] = useState(true);
  let [error, setError] = useState("");

  const router = useRouter();


  const submit = async () => {
    const form = document.querySelector("form");
    if (form && username && password && usernameValid && passwordValid) {
      // form.submit();
      const info = new FormData(form);
      const username = String(info.get("username"));
      const password = String(info.get("password"));

      // Hash the password before passing it to the API
      let hashPassword = crypto.createHash("sha256").update(password).digest("hex");

      // Use the users /login GET API endpoint to authenticate the user
      // Store the response (a JWT) as a cookie on the client
      fetch("/api/login",
        {
          method: "GET",
          headers: {
            "user-data": JSON.stringify({ username: username, password: hashPassword })
          }
        })
        .then(response => {
          const data = response.json();
          return data;
        })
        .then(data => {
          // If no error, check to see if the account has been verified using checkVerification(token)
          if (!data.error) {
            checkVerification(data.data);
          } else {
            setError(data.data);
          }

        })
    } else {
      return false;
    }
  }

  const checkVerification = (token: string) => {
    // Get user from database via given token
    fetch("/api/users", { headers: { token: token } })
      .then(res => res.json())
      .then(data => {
        const user = data.data;
        console.log(user);
        // If user is verified, store cookie on the client and redirect to home page
        if (user.verified) {
          createCookie(token);
          router.push("/")
          // Otherwise, push to /profile/verify to start verification
        } else {
          router.push(`/profile/verify?email=${user.email}`)
        }
      })
  }

  const createCookie = (data: string) => {
    setCookie("token", data, {
      path: "/",
      maxAge: 86400,
      sameSite: true
    })
  }

  return (
    <>
      <form className="flex-col flex align-middle">
        <h1 className="text-center">Login</h1>
        {error ? <p className="text-sm text-red-400 italic text-center mb-4">{error}. Please try again.</p> : ""}
        <Input
          id="username"
          type="text"
          label="Username"
          onChange={(e) => {
            setUsername(e.target.value);
            e.target.value ? setUsernameValid(true) : setUsernameValid(false)
          }}
          state={username}
          valid={usernameValid}
        />
        <Input
          id="password"
          type="password"
          label="Password"
          onChange={(e) => {
            setPassword(e.target.value)
            e.target.value ? setPasswordValid(true) : setPasswordValid(false)
          }}
          state={password}
          valid={passwordValid}
        />
        <button
          type="button"
          className={`
            ${usernameValid && username && password && passwordValid ? "bg-blue-300 text-black shadow-lg top-[-10px] hover:bg-blue-500"
              : "bg-slate-200 text-gray-300 hover:cursor-not-allowed hover:bg-slate-200 top-0"} 
            w-max px-6 py-2 rounded mx-auto font-bold relative transition-all mt-4
          `}
          onClick={submit}
        >Submit
        </button>
        <p className="text-sm text-center my-2">New user? <Link href="/sign-up" className="text-blue-400 underline">Sign up</Link> for a free account!</p>
      </form>
    </>
  )
}

export default Login;