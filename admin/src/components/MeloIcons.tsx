import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  filled?: boolean;
}

// 1. Melo Signature Mascot / Logo (Play button with smiley face expression)
export const MeloLogo = ({ size = 28, className = '', ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="58 48 128 139"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path
      d="M163.5 96.35C180.17 105.97 180.17 130.03 163.5 139.65L108 171.69C91.33 181.32 70.5 169.29 70.5 150.04V85.96C70.5 66.71 91.33 54.68 108 64.31Z"
      strokeWidth="19"
    />
    <path d="M97 112L108.5 98L120 112" strokeWidth="11" />
    <path d="M110.33 125C111.87 133.44 121.87 148.7 142.94 149.92" strokeWidth="11" />
  </svg>
);

// 2. Melo "M" Monogram Mark (from ic_mochy_mark.xml)
export const MeloMark = ({ size = 24, className = '', ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M4,18 C4,19.1 4.9,20 6,20 C7.1,20 8,19.1 8,18 L8,9 C8,7.9 8.9,7 10,7 C11.1,7 12,7.9 12,9 L12,17 C12,18.1 12.9,19 14,19 C15.1,19 16,18.1 16,17 L16,9 C16,7.9 16.9,7 18,7 C19.1,7 20,7.9 20,9 L20,18 C20,19.1 20.9,20 22,20 C23.1,20 24,19.1 24,18 L24,8.5 C24,5.5 21.5,3 18.5,3 C16.7,3 15.1,3.9 14,5.2 C12.9,3.9 11.3,3 9.5,3 C6.5,3 4,5.5 4,8.5 Z"
      fill="currentColor"
    />
  </svg>
);

// 3. Home Icon (from app/src/main/res/raw/home.svg & home_filled.svg)
export const MeloHomeIcon = ({ size = 20, filled = false, className = '', ...props }: IconProps) => {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 46 46" fill="none" className={className} {...props}>
        <path
          d="M0 39C0 42.866 3.13401 46 7 46H12C13.6569 46 15 44.6569 15 43V30C15 28.3431 16.3431 27 18 27H27.5C29.1569 27 30.5 28.3431 30.5 30V43C30.5 44.6569 31.8431 46 33.5 46H39C42.866 46 46 42.866 46 39V16.1551C46 15.1249 45.4714 14.1667 44.5999 13.6173L26.7331 2.35348C24.4521 0.915455 21.5479 0.915451 19.2669 2.35348L1.4001 13.6173C0.528615 14.1667 0 15.1249 0 16.1551V39Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" className={className} {...props}>
      <path
        d="M7 44H15C15.5523 44 16 43.5523 16 43V30C16 27.2386 18.2386 25 21 25H25C27.7614 25 30 27.2386 30 30V43C30 43.5523 30.4477 44 31 44H39C41.7614 44 44 41.7614 44 39V16.1553C44 15.8119 43.8236 15.4927 43.5332 15.3096L25.667 4.04492C24.0377 3.01776 21.9623 3.01776 20.333 4.04492L2.4668 15.3096C2.17637 15.4927 2 15.8119 2 16.1553V39C2 41.7614 4.23858 44 7 44Z"
        stroke="currentColor"
        strokeWidth="3.5"
      />
    </svg>
  );
};

// 4. Users / Account Icon (from app/src/main/res/drawable/account.xml)
export const MeloUsersIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M234,684q51,-39 114,-61.5T480,600q69,0 132,22.5T726,684q35,-41 54.5,-93T800,480q0,-133 -93.5,-226.5T480,160q-133,0 -226.5,93.5T160,480q0,59 19.5,111t54.5,93ZM480,520q-59,0 -99.5,-40.5T340,380q0,-59 40.5,-99.5T480,240q59,0 99.5,40.5T620,380q0,59 -40.5,99.5T480,520ZM480,880q-83,0 -156,-31.5T197,763q-54,-54 -85.5,-127T80,480q0,-83 31.5,-156T197,197q54,-54 127,-85.5T480,80q83,0 156,31.5T763,197q54,54 85.5,127T880,480q0,83 -31.5,156T763,763q-54,54 -127,85.5T480,880ZM480,800q53,0 100,-15.5t86,-44.5q-39,-29 -86,-44.5T480,680q-53,0 -100,15.5T294,740q39,29 86,44.5T480,800ZM480,440q26,0 43,-17t17,-43q0,-26 -17,-43t-43,-17q-26,0 -43,17t-17,43q0,26 17,43t43,17Z" />
  </svg>
);

// 5. App Releases Icon (from app/src/main/res/drawable/deployed_app_update.xml)
export const MeloReleasesIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M720,880L840,760L812,732L740,804L740,640L700,640L700,804L628,732L600,760L720,880ZM480,160L243,297L480,434L717,297L480,160ZM120,639L120,321Q120,299 130.5,281Q141,263 160,252L440,91Q450,86 459.5,83Q469,80 480,80Q491,80 501,83Q511,86 520,91L800,252Q819,263 829.5,281Q840,299 840,321L840,480Q822,480 800,480Q778,480 760,480L760,364L479,526L200,364L200,638L440,777Q440,798 440,823Q440,848 440,869L160,708Q141,697 130.5,679Q120,661 120,639ZM578.5,901.5Q520,843 520,760Q520,677 578.5,618.5Q637,560 720,560Q803,560 861.5,618.5Q920,677 920,760Q920,843 861.5,901.5Q803,960 720,960Q637,960 578.5,901.5Z" />
  </svg>
);

// 6. Landing Page CMS / Globe Icon (from app/src/main/res/drawable/globe.xml)
export const MeloGlobeIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M480,880Q397,880 324,848.5Q251,817 197,763Q143,709 111.5,636Q80,563 80,480Q80,397 111.5,324Q143,251 197,197Q251,143 324,111.5Q397,80 480,80Q563,80 636,111.5Q709,143 763,197Q817,251 848.5,324Q880,397 880,480Q880,563 848.5,636Q817,709 763,763Q709,817 636,848.5Q563,880 480,880ZM480,800Q614,800 707,707Q800,614 800,480Q800,473 799.5,465.5Q799,458 799,453Q794,482 772,501Q750,520 720,520L640,520Q607,520 583.5,496.5Q560,473 560,440L560,400L400,400L400,320Q400,287 423.5,263.5Q447,240 480,240L520,240L520,240Q520,217 532.5,199.5Q545,182 563,171Q543,166 522.5,163Q502,160 480,160Q346,160 253,253Q160,346 160,480L360,480Q426,480 473,527Q520,574 520,640L520,680L400,680L400,790Q420,795 439.5,797.5Q459,800 480,800Z" />
  </svg>
);

// 7. Announcements / Messages Icon (from app/src/main/res/drawable/chat_msg.xml)
export const MeloAnnouncementsIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M80,880L80,160Q80,127 103.5,103.5Q127,80 160,80L800,80Q833,80 856.5,103.5Q880,127 880,160L880,640Q880,673 856.5,696.5Q833,720 800,720L240,720L80,880ZM206,640L800,640L800,160L160,160L160,685L206,640Z" />
  </svg>
);

// 8. Moderation Reports / Bug Report Icon (from app/src/main/res/drawable/bug_report.xml)
export const MeloReportsIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M480,760Q546,760 593,713Q640,666 640,600L640,440Q640,374 593,327Q546,280 480,280Q414,280 367,327Q320,374 320,440L320,600Q320,666 367,713Q414,760 480,760ZM400,640L560,640L560,560L400,560L400,640ZM400,480L560,480L560,400L400,400L400,480ZM480,840Q415,840 359.5,808Q304,776 272,720L160,720L160,640L244,640Q241,620 240.5,600Q240,580 240,560L160,560L160,480L240,480Q240,460 240.5,440Q241,420 244,400L160,400L160,320L272,320Q286,297 303.5,277Q321,257 344,242L280,176L336,120L422,206Q450,197 479,197Q508,197 536,206L624,120L680,176L614,242Q637,257 655.5,276.5Q674,296 688,320L800,320L800,400L716,400Q719,420 719.5,440Q720,460 720,480L800,480L800,560L720,560Q720,580 719.5,600Q719,620 716,640L800,640L800,720L688,720Q656,776 600.5,808Q545,840 480,840Z" />
  </svg>
);

// 9. Audit Logs / Commit Icon (from app/src/main/res/drawable/commit.xml)
export const MeloAuditIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M352.5,634.5Q298,589 284,520L80,520L80,440L284,440Q298,371 352.5,325.5Q407,280 480,280Q553,280 607.5,325.5Q662,371 676,440L880,440L880,520L676,520Q662,589 607.5,634.5Q553,680 480,680Q407,680 352.5,634.5ZM480,600Q530,600 565,565Q600,530 600,480Q600,430 565,395Q530,360 480,360Q430,360 395,395Q360,430 360,480Q360,530 395,565Q430,600 480,600Z" />
  </svg>
);

// 10. Search Icon (from app/src/main/res/raw/search.svg)
export const MeloSearchIcon = ({ size = 18, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 43 44" fill="none" className={className} {...props}>
    <circle cx="17" cy="17" r="14" stroke="currentColor" strokeWidth="4.5" />
    <line x1="28.5" y1="30" x2="40" y2="41.5" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

// 11. Cloud Sync Icon (from app/src/main/res/drawable/cloud.xml)
export const MeloCloudIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M260,800Q169,800 104.5,737Q40,674 40,583Q40,505 87,444Q134,383 210,366Q235,274 310,217Q385,160 480,160Q597,160 678.5,241.5Q760,323 760,440Q829,448 874.5,499.5Q920,551 920,620Q920,695 867.5,747.5Q815,800 740,800L260,800ZM260,720L740,720Q782,720 811,691Q840,662 840,620Q840,578 811,549Q782,520 740,520L680,520L680,440Q680,357 621.5,298.5Q563,240 480,240Q397,240 338.5,298.5Q280,357 280,440L260,440Q202,440 161,481Q120,522 120,580Q120,638 161,679Q202,720 260,720Z" />
  </svg>
);

// 12. Library / Music Icon (from app/src/main/res/raw/lib.svg)
export const MeloLibraryIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 57 51" fill="none" className={className} {...props}>
    <path
      d="M45 4H18C13.5817 4 10 7.58172 10 12V39C10 43.4183 13.5817 47 18 47H45C49.4183 47 53 43.4183 53 39V12C53 7.58172 49.4183 4 45 4Z"
      stroke="currentColor"
      strokeWidth="4"
    />
    <line x1="2" y1="10" x2="2" y2="43" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M22 31.5C22 28.4624 24.4624 26 27.5 26H29.5C32.5376 26 35 28.4624 35 31.5C35 34.5376 32.5376 37 29.5 37H27.5C24.4624 37 22 34.5376 22 31.5Z" fill="currentColor" />
    <path d="M31 17C31 15.8954 31.8954 15 33 15C34.1046 15 35 15.8954 35 17V30C35 31.1046 34.1046 32 33 32C31.8954 32 31 31.1046 31 30V17Z" fill="currentColor" />
    <path d="M31 17C31 15.8954 31.8954 15 33 15H39C40.1046 15 41 15.8954 41 17C41 18.1046 40.1046 19 39 19H33C31.8954 19 31 18.1046 31 17Z" fill="currentColor" />
  </svg>
);

// 13. Equalizer Icon (from app/src/main/res/drawable/equalizer.xml)
export const MeloEqualizerIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M160,800L160,480L320,480L320,800L160,800ZM400,800L400,160L560,160L560,800L400,800ZM640,800L640,360L800,360L800,800L640,800Z" />
  </svg>
);

// 14. Download Icon (from app/src/main/res/drawable/download.xml)
export const MeloDownloadIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 960 960" fill="currentColor" className={className} {...props}>
    <path d="M240,800Q207,800 183.5,776.5Q160,753 160,720L160,600L240,600L240,720L720,720L720,600L800,600L800,720Q800,753 776.5,776.5Q753,800 720,800L240,800ZM480,640L280,440L336,382L440,486L440,160L520,160L520,486L624,382L680,440L480,640Z" />
  </svg>
);

// 15. Settings Icon (from app/src/main/res/drawable/nav_mochy_outline.xml)
export const MeloSettingsIcon = ({ size = 20, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
  </svg>
);
