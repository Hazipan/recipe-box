import Link from "next/link";

const Verify = () => {
  return (
    <>
      <h1>Please verify your account.</h1>
      <p>Looks like your account isn't verified yet. In order to use the site, you'll need to verify your email address. <Link href="" className="underline">Click here to send a verification email</Link>.</p>
    </>
  )
}

export default Verify;