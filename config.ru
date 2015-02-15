require "hobbit"
require "json"

class App < Hobbit::Base
  static_files = Dir.glob("testcases/docroot-for-testing/form-o-fill-testing/*.html").map { |f| f.gsub(/^.*\//,"") }
  use Rack::Static, root: "testcases/docroot-for-testing", urls: ['/form-o-fill-testing']

  # List all URLs
  get "/" do
    html = static_files.map { |f| "<li><a href='/form-o-fill-testing/#{f}'>#{f}</a></li>" }.join
    html += "<li><a href='/sleep/5'>Sleep 5 seconds and return JSON</a></li>"
    html
  end

  # Sleep N seconds
  get "/sleep/:seconds" do
    sleep request.params[:seconds].to_i

    response.headers["Content-Type"] = "application/json"
    { sleep: request.params[:seconds] }.to_json
  end
end

run App.new
