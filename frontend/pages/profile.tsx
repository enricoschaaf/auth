import { useAuth } from "hooks/useAuth"
import { useQuery } from "react-query"
import { instance } from "utils/axios"

async function getProfile() {
  const { data } = await instance.get("/api/profile")
  return data
}

const Profile = () => {
  useAuth()
  const { data } = useQuery("profile", getProfile)
  return (
    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium leading-5 text-gray-700"
      >
        Email
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input onSubmit()
          id="email"
          className="form-input block w-full sm:text-sm sm:leading-5"
          placeholder={data?.email}
        />
      </div>
    </div>
  )
}

export default Profile
