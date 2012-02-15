class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :ensure_domain

  APP_DOMAIN = 'www.yammerfall.com'

  def ensure_domain
    if request.env['HTTP_HOST'] != APP_DOMAIN
      redirect_to "https://#{APP_DOMAIN}", :status => 301
    elsif request.env['HTTPS'] != 'on'
   	  redirect_to "https://#{APP_DOMAIN}", :status => 301
    end
  end
end
