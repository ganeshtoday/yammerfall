class ApplicationController < ActionController::Base
  protect_from_forgery
  #include ::SslRequirement

  #ssl_exceptions

  #before_filter :ensure_domain

  #APP_DOMAIN = 'www.yammerfall.com'

  #def ensure_domain
  #  if request.env['HTTP_HOST'] != APP_DOMAIN
  #    # HTTP 301 is a "permanent" redirect
  #    redirect_to "https://#{APP_DOMAIN}", :status => 301
  #  end
  #end
end
