import { optionData } from "./option.js";
import { intIndex } from "./components/index.js";
import { initProduct } from "./components/productPage.js";
import { stickyPhotos } from "./functions/stickyphotos.js";
import { errorToCart } from "./functions/errorToCart.js";
import { initHeader } from "./components/header.js";
import { initVideoPlayAgain } from "./functions/video-play-again.js";
import { initCart } from "./components/cart.js";
import { validation } from "./functions/validation.js";

let setupData;

const googleRef = `<div class="HeaderContainer__Inner-sc-1532ffp-0 kfmkAH HeaderComponent__StyledHeader-sc-9lcg5s-0 ggCtvU es-header-container"><div class="HeaderInfoContainer__Info-sc-16jx15e-0 iXURJw HeaderStyle8__Info-sc-b1gtz-1 fYYhKJ es-header-info"><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ HeaderStyle8__StyledHeaderRating-sc-b1gtz-0 brkxaF es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingValue__Container-sc-fl6036-0 iCNeqx es-rating-value">4.9</div></div></div><div class="HeaderHeading__Container-sc-1fncda3-0 llhhPp es-header-heading-container"><div class="HeaderHeading__Text-sc-1fncda3-1 AGaFi es-header-heading-text">Google Recenzie</div></div><div class="HeaderRating__RatingContainer-sc-117jf4y-0 iTpmcQ es-header-rating-container"><div class="Rating__Container-sc-bk54oq-0 izQGGt es-rating-container HeaderRating__Rating-sc-117jf4y-1 ieRgGM es-header-rating"><div class="RatingBar__Container-sc-qimg51-0 eyLxdR es-rating-bar-container"><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-filled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw nUbNv es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div><div class="RatingItemFilledSvg__Container-sc-14jss50-0 bBmSuk es-rating-item es-rating-stars-item-unfilled"><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Unfilled-sc-14jss50-2 bXVxrw cHATJH es-rating-item-unfilled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div><div class="RatingItemFilledSvg__ContainerAbsolute-sc-14jss50-1 RatingItemFilledSvg__Filled-sc-14jss50-3 bXVxrw fHHaSD es-rating-item-filled"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3796_102578)"><path d="M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z" fill="none"></path></g><defs><clipPath id="clip0_3796_102578"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></div></div></div></div><span class="HeaderRating__ReviewsCount-sc-117jf4y-2 kSLkip es-header-rating-reviews-count">(47)</span></div></div><div class="HeaderWriteReviewButton__Component-sc-a5mrro-0 kBskxl es-header-write-review-button-container"><a target="_blank" href="https://www.google.com/maps/place/Luxury+Car+Design/@49.1861708,18.7330054,1043m/data=!3m1!1e3!4m8!3m7!1s0x8c8f632b21071671:0xd702e416d6787c20!8m2!3d49.1861708!4d18.7330054!9m1!1b1!16s%2Fg%2F11txlgxckd?authuser=0&hl=cs&entry=ttu&g_ep=EgoyMDI1MDYwMy4wIKXMDSoASAFQAw%3D%3D" ><button size="14" class="ButtonBase__ButtonContainer-sc-p43e7i-3 euBiGU HeaderWriteReviewButton__WriteReviewButton-sc-a5mrro-1 iqYjDs es-header-write-review-button" type="button" style="border-radius: 24px; border-color: rgba(0, 0, 0, 0); line-height: 1.32; color: rgb(255, 255, 255); font-family: inherit; font-weight: bold; font-size: 14px; font-style: normal; background-color: rgb(25, 123, 255); border-width: 2px;"><span class="ButtonBase__Overlay-sc-p43e7i-4 jhGZeV" style="padding: 8px 21px; border-radius: calc(22px); background-color: rgba(0, 0, 0, 0);"><span class="ButtonBase__Ellipsis-sc-p43e7i-5 dqiKFy">zobraziť na google</span></span></button><a></div></div>`;

$.getJSON(optionData.downloadData, function (data) {
  setupData = data;

  console.log("setupData:", setupData);
  console.log("setupData.settings:", setupData.settings);
  console.log("setupData.cars:", setupData.cars);
  initModelSelect(setupData);
  googleReviews(setupData);
  initProduct(setupData);
  addNote();
});

const logoGoogle =
  '<svg viewBox="0 0 512 512" height="18" width="18"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path></g></svg>';

jQuery(document).ready(function ($) {
  // dinamicPictures();
  initHeader();

  intIndex();
  initSignpost();

  //stickyPhotos();
  errorToCart();
  initVideoPlayAgain();
  initCart();
  validation();

  setTimeout(() => {
    $("body").addClass("showBody");
  }, 500);
});

/**
 * Dynamically updates an image based on the visible section on the screen./
 */
function dynamicPictures() {
  const sections = $(".text-block");
  const dynamicImage = $("#dynamic-image");
  const transitionDuration = 500; // Match this to the CSS transition duration

  /**
   * Updates the image based on the currently visible section.
   */
  function changeImage() {
    let currentSection = null;

    // Find the section currently in the middle of the viewport
    for (let i = 0; i < sections.length; i++) {
      const section = $(sections[i]);
      const rect = sections[i].getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;

      if (sectionTop <= window.innerHeight / 2 && sectionBottom >= window.innerHeight / 2) {
        currentSection = section;
        break;
      }
    }

    if (currentSection) {
      const newImageSrc = currentSection.data("picture");

      if (dynamicImage.attr("src") !== newImageSrc) {
        // Add transition effect
        dynamicImage.addClass("transition-out");

        setTimeout(() => {
          dynamicImage.attr("src", newImageSrc).removeClass("transition-out").addClass("transition-in");

          // Remove transition-in class after animation ends
          setTimeout(() => {
            dynamicImage.removeClass("transition-in");
          }, transitionDuration);
        }, transitionDuration);
      }
    }
  }

  // Optimize scrolling event with throttle
  let scrollTimeout = null;
  $(window).on("scroll", () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(changeImage, 100); // Adjust the debounce delay if necessary
  });

  changeImage(); // Run once on page load
}

function initModelSelect() {
  const header = $("h1").text();
  if (header.includes("box")) return;

  let insertPosidion = ".in-index .content-wrapper.container:eq(1)";
  if ($(".mobile")[0]) {
    insertPosidion = ".in-index .row.banners-content.body-banners";
  }
  if ($(".type-product")[0]) {
    insertPosidion = ".availability-value";
  }
  const getBrand = sessionStorage.getItem("Brand");
  const getModel = sessionStorage.getItem("Model");
  const getYear = sessionStorage.getItem("Year");
  const getCarType = sessionStorage.getItem("carType");

  const section = $("<section>", {
    id: "model-selector",
  });
  if ($("body.mobile")[0]) {
    $(section).prependTo(insertPosidion);
  } else {
    $(section).insertAfter(insertPosidion);
  }

  const container = $("<div>", {
    class: "model-selector container",
  }).appendTo(section);
  if ($(".in-index")[0]) {
    $("<h2>").text("zadajte údaje o vozidle").appendTo(container);
    $('<div class="prefix">a vytvorte si cenovo zvýhodnení set podľa vaších predstáv</div>').appendTo(container);
  }
  const choiceWrap = $("<div>").addClass("modl-selector-wrap").appendTo(container);
  const znacka =
    `
        <div class="surcharge-list brands dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_znacka[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const model =
    `
        <div class="surcharge-list models dm-selector">
          
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_model[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const rocnik =
    `
        <div class="surcharge-list years dm-selector">
            
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>` +
    cstm_rocnik[0] +
    `</option>
                </select>
            </div>
        </div>
        `;

  const type = `
        <div class="surcharge-list type-selector">
           
            <div class='selector'>
                <select required="required">
                    <option class='notselect'>Typ auta</option>
                </select>
            </div>
        </div>
        `;

  const button = `<div class='btn choice-Model'>Zvolit model</div>`;

  if ($(".in-index")[0]) {
    $(znacka + model + rocnik + type + button).appendTo(choiceWrap);
  } else {
    $(znacka + model + rocnik + type).appendTo(choiceWrap);
  }

  $(setupData.settings.carVariant.split(",")).each(function () {
    const option = $("<option>").text(this).appendTo(".type-selector .selector select");
  });

  if (getBrand != null) {
    console.log(getBrand);
    $("<option>" + getBrand + "</option>").prependTo(".surcharge-list.brands.dm-selector select");
    $(".surcharge-list.brands.dm-selector select").val(getBrand);
  }
  if (getModel != null) {
    $("<option>" + getModel + "</option>").prependTo(".surcharge-list.models.dm-selector select");
    $(".surcharge-list.models.dm-selector select").val(getModel);
  }
  if (getYear != null) {
    $("<option>" + getYear + "</option>").prependTo(".surcharge-list.years.dm-selector select");
    $(".surcharge-list.years.dm-selector select").val(getYear);
  }
  if (getCarType != null) {
    $("<option>" + getCarType + "</option>").prependTo(".surcharge-list.type-selector select");
    $(".surcharge-list.type-selector select").val(getCarType);
  }

  const cars = setupData.cars;

  const numberOfBrands = Object.keys(cars).length;
  const brands = Object.keys(cars);
  for (let i = 0; i < numberOfBrands; i++) {
    $("<option>" + brands[i] + "</option>").appendTo(".brands select");
  }
  const d = new Date();
  const currentYear = d.getFullYear();
  for (let year = Number(years_from); year <= currentYear; year++) {
    $("<option>" + year + "</option>").appendTo(".years select");
  }

  const other_option = "<option>" + other + "</option>";
  $(other_option).appendTo(".type select");
  $(other_option).appendTo(".years select");

  $(".brands select").on("change", function () {
    if ($(this).val() === cstm_znacka.at(1)) {
      $(".models option:not(.notselect)").remove();
    } else {
      $(".models option:not(.notselect)").remove();
      const models_for_brand = setupData.cars[$(this).val()];
      if (models_for_brand && Array.isArray(models_for_brand)) {
        for (let i = 0; i < models_for_brand.length; i++) {
          $("<option>" + models_for_brand.at(i) + "</option>").appendTo(".models select");
        }
      }
    }
  });

  $(".btn.choice-Model").on("click", function () {
    saveModel(true);
  });
  $(".surcharge-list").on("click", function () {
    $(".surcharge-list").on("change", function () {
      saveModel(false);
    });
  });
}

function saveModel(redirect) {
  const Brand = $(".surcharge-list.brands.dm-selector select").val();
  const Model = $(".surcharge-list.models.dm-selector select").val();
  const Year = $(".surcharge-list.years.dm-selector select").val();
  const type = $(".surcharge-list.type-selector select").val();
  setTimeout(() => {
    console.log(Brand + " " + Model + " " + Year);
    sessionStorage.setItem("model", Brand + " " + Model + " " + Year + " " + type);
    sessionStorage.setItem("Brand", Brand);
    sessionStorage.setItem("Model", Model);
    sessionStorage.setItem("Year", Year);

    sessionStorage.setItem("carType", type);
  }, 100);
  if ($(".in-index")[0] && redirect) {
    window.location.href = "/rozcestnik/";
  }
}
function initSignpost() {
  const model = sessionStorage.getItem("model");
  $("section#Model-selecte .model span").text(model);
}

function googleReviews() {
  // console.log('review')

  const google = $("<section/>").attr("id", "goggle-review-wrap").html(googleRef);
  if ($(".mobile")[0]) {
    google.appendTo(".row.banners-content.body-banners");
  } else {
    google.insertAfter(".in-index section#model-selector");
  }

  // $("<section/>")
  //   .attr("id", "goggle-review-wrap")
  //   .insertBefore(".type-product footer");

  // $(
  //     '<div class="header-rewiew"><h3> Děkujeme za Vaše recenze</h3></div>'
  // ).appendTo("#goggle-review-wrap");

  // const review = $("<div/>")
  //     .addClass("review-row")
  //     .appendTo("#goggle-review-wrap");

  // $(`<div class="ti-widget-container"> <a href="#dropdown" class="ti-header source-Google" data-subcontent="1" data-subcontent-target=".ti-dropdown-widget"> <div class="ti-small-logo"> <img src="https://cdn.trustindex.io/assets/platform/Google/logo.svg" loading="lazy" alt="Google"  height="25"> </div><div class="review-stars"><ul><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li></ul></div> <div class="ti-mob-row"> <span class="nowrap"><strong>` +
  //     numberReviews + ` recenzí</strong></span> <span class="ti-arrow-down"></span> </div> </a> </div>`).appendTo(review);
  // $("<div/>").attr("id", "google-reviews").appendTo(review);

  // $(".js-navigation-container").insertAfter(".site-name");
  // $(".contact-box.no-image").clone().appendTo(".top-navigation-menu");
  // $('a.ti-header.source-Google').on('click', function() {
  //     createPopUp()
  // })

  // const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJcRYHIStjj4wRIHx41hbkAtc&fields=name,rating,reviews&key=AIzaSyCeZU6zd0N8r7Uxu73NUIOhftj0OUGxcU4`;
  // $('<div class="header-rewiew"><h3> Ďakujeme za Vaše recenzie po slovensky</h3></div>').appendTo("#goggle-review-wrap");

  //   $(`<div class="elfsight-app-0852ca33-abe7-4be3-8eb8-6bfa99b7bde9" data-elfsight-app-lazy></div>`).appendTo("#goggle-review-wrap");
  //   $(`<script src="https://static.elfsight.com/platform/platform.js" async></script>
  // `).appendTo("#goggle-review-wrap");
  //   function waitForElementAndRemove() {
  //     const targetElement = $('a:contains("Free Google Reviews widget")');

  //     if (targetElement.length) {
  //       targetElement.addClass("hide").remove(); // Odstranění elementu
  //       console.log("Element byl odstraněn:", targetElement);
  //     } else {
  //       // Zkontroluj znovu za 100 ms
  //       setTimeout(waitForElementAndRemove, 1000);
  //     }
  //   }

  //   // Spuštění funkce
  //   waitForElementAndRemove();
  //   // const review = $("<div/>")
  //   //   .addClass("review-row")
  //   //   .appendTo("#goggle-review-wrap");
  //   // $(
  //   //   `<div class="grw-slider-header"><div class="grw-slider-header-inner"><div class="wp-google-place"><div class="wp-google-left"></div><div class="wp-google-right"><div class="wp-google-name"><a href="https://search.google.com/local/reviews?placeid=ChIJcRYHIStjj4wRIHx41hbkAtc" target="_blank" rel="nofollow noopener"><span>Luxury car</span></a></div><div><span class="wp-google-rating">5.0</span><span class="wp-google-stars"><span class="wp-stars"><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#e7711b"></path></svg></span><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#e7711b"></path></svg></span><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#e7711b"></path></svg></span><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#e7711b"></path></svg></span><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#e7711b"></path></svg></span></span></span></div><div class="wp-google-powered">Na základě <a href="https://search.google.com/local/reviews?placeid=ChIJcRYHIStjj4wRIHx41hbkAtc" style="font-weight: 600 !important;text-decoration: underline !important;" target="_blank">` +
  //   //     numberReviews +
  //     ` recenzí</a></div><div class="wp-google-powered"><img src="https://www.mojerky.cz/user/documents/upload/google.svg" alt="powered by Google" width="144" height="18" title="powered by Google"></div><div class="wp-google-wr"><a href="https://search.google.com/local/reviews?placeid=ChIJcRYHIStjj4wRIHx41hbkAtc" onclick="return rplg_leave_review_window.call(this)">Napsat&nbsp;recenzi</a></div></div></div></div></div>`
  // ).appendTo(review);
  // $("<div/>").attr("id", "google-reviews").appendTo(review);

  // $(".js-navigation-container").insertAfter(".site-name");
  // $(".contact-box.no-image").clone().appendTo(".top-navigation-menu");

  // $("<a/>")
  //   .addClass("yelowText")
  //   .attr("href", "#goggle-review-wrap")
  //   .html(
  //     `<div class="review-stars"><ul><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li></ul></div><span class="numreview">(` +
  //       numberReviews +
  //       ")</span>Hodnocení zákazníků"
  //   )
  //   .insertAfter(" .p-data-wrapper h1");

  // $("<a/>")
  //   .addClass("yelowText")
  //   .attr("href", "#goggle-review-wrap")
  //   .html(
  //     `<div class="review-stars"><ul><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li><li><i class="star"></i></li></ul></div><span class="numreview">(` +
  //       numberReviews +
  //       ")</span>Hodnocení zákazníků"
  //   )
  //   .insertBefore(" .p-image");

  // if ($("#google-reviews").length == 0) {
  //   return;
  // }
  // // Find a placeID via https://developers.google.com/places/place-id
  // $("#google-reviews").googlePlaces({
  //   placeId: "ChIJcRYHIStjj4wRIHx41hbkAtc",
  //   // the following params are optional (default values)
  //   header: "", // html/text over Reviews
  //   footer: "", // html/text under Reviews block
  //   maxRows: 5, // max 5 rows of reviews to be displayed
  //   minRating: 3, // minimum rating of reviews to be displayed
  //   months: [
  //     "Jan",
  //     "Feb",
  //     "Mär",
  //     "Apr",
  //     "Mai",
  //     "Jun",
  //     "Jul",
  //     "Aug",
  //     "Sep",
  //     "Okt",
  //     "Nov",
  //     "Dez",
  //   ],
  //   textBreakLength: "90", // length before a review box is set to max width
  //   shortenNames: true, // example: "Max Mustermann" -> "Max M."",

  //   showProfilePicture: true,
  // });
  // const checkReviewsLoaded = setInterval(() => {
  //   if ($(".review-header").length > 0) {
  //     // Pokud recenze byly přidány
  //     // Zastaví kontrolu po načtení
  //     clearInterval(checkReviewsLoaded);
  //     $("#google-reviews").slick({
  //       dots: true,
  //       centerMode: false,
  //       infinite: true,
  //       slidesToShow: 4,
  //       slidesToScroll: 1,
  //       autoplay: true,
  //       autoplaySpeed: 8000,
  //       arrows: false,

  //       responsive: [
  //         {
  //           breakpoint: 1600,
  //           settings: {
  //             slidesToShow: 4,
  //             slidesToScroll: 1,
  //           },
  //         },
  //         {
  //           breakpoint: 1480,
  //           settings: {
  //             slidesToShow: 3,
  //             slidesToScroll: 1,
  //           },
  //         },
  //         {
  //           breakpoint: 1200,
  //           settings: {
  //             slidesToShow: 2,
  //             slidesToScroll: 1,
  //           },
  //         },
  //         {
  //           breakpoint: 800,
  //           settings: {
  //             slidesToShow: 1,
  //             slidesToScroll: 1,

  //             autoplay: false,
  //           },
  //         },
  //         // {
  //         //     breakpoint: 350,
  //         //     settings: {
  //         //         slidesToShow: 1,
  //         //         slidesToScroll: 1,
  //         //     },
  //         // },
  //       ],
  //     });
  //   }
  // }, 200);
  // // Kontrola každých 200 ms
}

function createPopUp() {
  $(`<div class="ti-dropdown-widget">
        <div class="ti-dropdown-widget-inner">
            <div class="ti-widget-container">
                <div class="ti-popup-header">
                    <a href="#" class="ti-close-lg"></a>
                </div>
                <div class="ti-reviews-container">
                    <div class="ti-reviews-container-wrapper"></div>
                </div>
            </div>
        </div>
    </div>`).appendTo(".model-selector.container");

  if ($(".ti-reviews-container-wrapper").length == 0) {
    return;
  }

  // Find a placeID via https://developers.google.com/places/place-id
}
setTimeout(function () {
  $(logoGoogle).appendTo(".review-item-long");
  $("#google-reviews br").remove();

  // $("#google-reviews").slick({
  //     dots: true,
  //     centerMode: false,
  //     infinite: true,
  //     slidesToShow: 5,
  //     slidesToScroll: 2,
  //     autoplay: true,
  //     autoplaySpeed: 8000,
  //     arrows: false,

  //     responsive: [{
  //             breakpoint: 1600,
  //             settings: {
  //                 slidesToShow: 4,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 1480,
  //             settings: {
  //                 slidesToShow: 3,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 1200,
  //             settings: {
  //                 slidesToShow: 2,
  //                 slidesToScroll: 1,
  //             },
  //         },
  //         {
  //             breakpoint: 800,
  //             settings: {
  //                 slidesToShow: 1,
  //                 slidesToScroll: 1,

  //                 autoplay: false,
  //             },
  //         },
  //         // {
  //         //     breakpoint: 350,
  //         //     settings: {
  //         //         slidesToShow: 1,
  //         //         slidesToScroll: 1,
  //         //     },
  //         // },
  //     ],
  // });
}, 2500);

function createPop() {
  $(`<div class="overflow" style="position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div class="ti-dropdown-widget">
        <style>
        .ti-dropdown-widget {
    opacity: 1;
    display: -ms-flexbox;
    display: flex;
   
    position: absolute;
    top: initial;
    bottom: initial;
    background: none;
    text-align: left !important;
    z-index: 999999;
    left: 50%;
        width: 100%;
    transform: translateX(-50%);
}
@media (max-width: 768px) {
    .ti-dropdown-widget {
        left: unset;
        transform: none;
        width: 90%;
    }
}

.ti-dropdown-widget-inner {
    height: 100%;
    padding: 40px 10px 10px 10px;
    overflow: visible;
    background-color: #ffffff !important;
    position: relative;
    max-width: 700px;
    margin: auto;
    box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.1), 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
     width: 100%;

}

.ti-content-container-wrapper {
    overflow: auto;
    display: inherit;
    margin: 0px !important;
    margin-top: 0px !important;
    padding-right: 20px;
}

.ti-widget-container {
    margin-bottom: 0px;
    height: 100%;
    display: flex !important;
    flex-direction: column;
    font-size: 14px;
    line-height: 1.4em;
    overflow-y: scroll;
    height: 95%;
}

.ti-close-lg {
    position: absolute;
    width: 30px;
    height: 30px;
    background-color: #fff;
    right: 6px;
    top: 6px;
    border-radius: 50px;
    display: block;
    cursor: pointer;
    pointer-events: visible !important;
    color: #333;
    &:before,
    &:after {
        content: "";
        position: absolute;
        display: block;
        border-radius: 2px;
        width: 16px;
        height: 3px;
        top: 13px;
        left: 7px;
        background-color: #555;
    }
    &:before {
        transform: rotate(45deg);
    }
    &:after {
        transform: rotate(-45deg);
    }
}
        </style>
        
        <div class="ti-dropdown-widget-inner">
        <div class="ti-popup-header">      <a href="#" class="ti-close-lg"></a>
                </div>
            <div class="ti-widget-container">
                
              
                <div class="ti-content-container">
                    <div class="ti-content-container-wrapper"></div>
                </div>
            </div>
            </div>
        </div>
    </div>`).appendTo("body");
  $("a.ti-close-lg").on("click", function () {
    $(".overflow").remove();
  });
}

function upsalePage(orders) {
  $("<div>", {
    class: "navigatte-button class" + orders + "  upsale",
    "data-option": "option-" + orders,
  }).appendTo(".navidation-Wrap");
  const pageWrap = $("<div>", { class: "parameter-wrap upsale " }).appendTo(".content-wrap");
  $("<h5>", {
    text: "Rekapitulace",
  }).appendTo(pageWrap);
  $("<p>", {
    text: " text pro upsale ",
  }).appendTo(pageWrap);
  const buttonWrao = $("<div>", {
    class: "button-wrap",
  }).appendTo(pageWrap);
  $("<div>", { class: "btn upsale", text: "upsale" }).appendTo(buttonWrao);
  $("<div>", { class: "btn close", text: "Ukoncit konfigurator" }).appendTo(buttonWrao);
}

// function initCart() {
//   if (!$(".id--9")[0]) return;
//   const bannerWrap = $("<div>", {
//     class: "banner-wrap",
//   }).insertBefore("table.cart-table");
//   $("<div>", {
//     class: "h3",
//     text: "Dokonalá ochrana pre váš kufor za EXTRÉMNE zvýodnenu cenu!",
//   }).appendTo(bannerWrap);
//   $("<p>", {
//     text: "Len teraz môžete pridať luxusné autokoberce do kufra alebo úložné boxy za výrazne zvýhodnenú cenu. Chráňte kufor Vášho vozidla pred nečistotami a majte všetko na mieste!",
//   }).appendTo(bannerWrap);
//   const timer = $("<div>", {
//     class: "timer-wrap",
//   }).appendTo(bannerWrap);
//   $("<span>", {
//     text: "Špeciálna ponuka končí za",
//   }).appendTo(timer);

//   const countdownSpan = $("<span>", {
//     class: "countdown",
//     text: "",
//   }).appendTo(timer);

//   $("<a>", {
//     class: "btn",
//     text: "Pridať so zľavou do objednávky!",
//     href: "#",
//   }).appendTo(bannerWrap);
//   $("<div>", {
//     class: "description",
//     text: "Túto ponuku získate len pri tejto objednávke. Nepremeškajte šancu získať doplnky za najlepšiu cenu!",
//   }).appendTo(bannerWrap);

//   // Získání aktuálního času odpočtu ze sessionStorage nebo nastavení 30 minut
//   let endTime = sessionStorage.getItem("timerEndTime");
//   if (!endTime || new Date(endTime) < new Date()) {
//     // Pokud není uložený čas nebo je již vypršel, nastavíme nový odpočet na 30 minut
//     endTime = new Date(new Date().getTime() + 30 * 60 * 1000);
//     sessionStorage.setItem("timerEndTime", endTime);
//   } else {
//     // Pokud je uložený čas platný, použijeme jej
//     endTime = new Date(endTime);
//   }

//   // Aktualizace odpočtu každou sekundu
//   function updateCountdown() {
//     const now = new Date();
//     const remainingTime = endTime - now;

//     if (remainingTime <= 0) {
//       countdownSpan.text("čas vypršel!");
//       clearInterval(countdownInterval);
//       sessionStorage.removeItem("timerEndTime");
//     } else {
//       const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
//       const seconds = Math.floor((remainingTime / 1000) % 60);
//       countdownSpan.text(`${minutes} min ${seconds} sec`);
//     }
//   }

//   // Spustit aktualizaci odpočtu každou sekundu
//   const countdownInterval = setInterval(updateCountdown, 1000);
//   updateCountdown();
// }

function dinamicPictures() {
  var sections = $(".text-block");
  var dynamicImage = $("#dynamic-image");

  function changeImage() {
    var currentSection = null;

    sections.each(function () {
      var section = $(this);
      var rect = this.getBoundingClientRect();
      var sectionTop = rect.top;
      var sectionBottom = rect.bottom;

      // Kontrola, zda je sekce uprostřed obrazovky
      if (sectionTop <= $(window).height() / 2 && sectionBottom >= $(window).height() / 2) {
        currentSection = section;
        return false; // Ukončíme each loop, protože jsme našli aktuální sekci
      }
    });

    if (currentSection) {
      var newImageSrc = currentSection.data("picture");

      if (dynamicImage.attr("src") !== newImageSrc) {
        // Přidání přechodového efektu
        dynamicImage.css("opacity", 0);

        setTimeout(function () {
          dynamicImage.attr("src", newImageSrc);
          dynamicImage.css("opacity", 1);
        }, 500); // Doba trvání přechodu musí odpovídat CSS přechodu
      }
    }
  }

  $(window).on("scroll", changeImage);
  changeImage(); // Inicializace při načtení stránky
}

function addNote() {
  if ($(".id--17")[0]) {
    console.log("adresa");
    // toNote();
    const city = sessionStorage.getItem("model");
    console.log(city);

    // $("input#billZip").val(city).addClass("disabled");

    // $("label.whole-width").on("click", function () {
    //   console.log("aaaa");

    //   setTimeout(function () {
    //     if ($("div#shipping-address.visible")[0]) {
    //       $("input#deliveryZip").val(city).addClass("disabled");
    //       $("input#billZip").removeClass("disabled");
    //     } else {
    //       $("input#billZip").val(city).addClass("disabled");
    //       $("input#deliveryZip").removeClass("disabled");
    //     }
    //   }, 400);
    // });

    shoptet.custom.postSuccessfulValidation = function (form) {
      if ($(form).attr("id") === "order-form") {
        console.log("tttt");
        toNote();
      }
      return true;
    };

    function toNote() {
      const city = sessionStorage.getItem("adressDelivery");

      const fakturacniAdresa =
        `
            Adresa zadaná pro výpočet:
             ` +
        city +
        `
      
     
        `;

      const model =
        `
            model : ` +
        sessionStorage.getItem("model") +
        `  
        `;

      let poznamka = $("#remark").val();

      if (poznamka) {
        poznamka += `\n\n${model}`;
      } else {
        poznamka = model;
      }

      $("#remark").val(poznamka);
    }
  }
}
