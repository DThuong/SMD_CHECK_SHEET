
import logo404 from '../assets/image/404.jpg'
const ErrorPage = () => {

  return (
    <div>
        <main className="grid min-h-[50vh] place-items-center px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center p-4 my-4">
                <img src={logo404} alt="" />
                <h1 className="mt-0 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">Page not found</h1>
                <p className="mt-6 text-lg font-medium text-pretty text-gray-700 sm:text-xl/8">Sorry, we couldn’t find the page you’re looking for.</p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                <a href="/" className="rounded-md bg-gray-700 px-3 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 text-decoration-none">Go back home</a>
                <a href="/support" className="text-lg text-decoration-none hover:border-b-2 font-semibold text-gray-700!">Contact support <span aria-hidden="true">&rarr;</span></a>
                </div>
            </div>
        </main>
    </div>
  )
}

export default ErrorPage