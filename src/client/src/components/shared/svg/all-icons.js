import React from 'react'

export const SRELogo = props => {
  const { className, ...rest } = props
  const cName = (className || '') + ' svg-icon SRE_Logo-svg'
  return (
    <svg className={cName} {...rest} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 141">
      <path strokeMiterlimit="10" d="M780.3.5v141H.9c-.1-10.1-.3-20.2-.4-30.3L.2 69.6c20-.6 40.1-1.1 60.1-1.7 20.7-.6 36.5-1.2 57.3-2.2 18.5-.9 38.9-2 64.4-4 15.4-1.2 35.2-3.1 58.4-5.8 20.3-3.3 40.5-6.6 60.8-9.8 20.3-3.6 40.6-7.1 60.9-10.7 19.7-3.4 39.3-6.9 59-10.3 19.6-3.9 39.2-7.9 58.8-11.8l60.3-3.6c80-3.2 160-6.2 240.1-9.2z" />
      <text fontFamily="Tahoma" fontSize="110" transform="translate(356.218 116.406)" fill="white">Sport RE</text>
    </svg>
  )
}