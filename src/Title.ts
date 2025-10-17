import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import * as gradient from "gradient-string";

export const MR_FINDER_TITLE = () => {
    console.clear();

    const banner = `
      ███████╗██╗   ██╗███╗   ███╗███╗   ███╗ █████╗ ██████╗ ██╗███████╗███████╗██████╗ 
    ██╔════╝██║   ██║████╗ ████║████╗ ████║██╔══██╗██╔══██╗██║╚══███╔╝██╔════╝██╔══██╗
  ███████╗██║   ██║██╔████╔██║██╔████╔██║███████║██████╔╝██║  ███╔╝ █████╗  ██████╔╝
 ╚════██║██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██╔══██╗██║ ███╔╝  ██╔══╝  ██╔══██╗
███████║╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║  ██║██║███████╗███████╗██║  ██║
╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝  ╚═╝

     S U M M A R I Z E _ M U L T I P L E _ D O C U M E N T S _ A T _ O N C E !

─────────────────────────────────────────────────────────────────────────────────────
`;

    console.log(gradient.retro(banner));
    console.log(chalk.green("\nReady to search"));
    console.log(chalk.green(`StartTime : ${new Date().toString()}\n`));
    console.log(chalk.blue(`Version : 1.0.8v`));
};

export const MR_FINDER_GOODBYE = () => {
    console.clear();

    const banner = `
       ██████╗  ██████╗  ██████╗ █████╗  ██████╗ ██╗   ██╗███████╗
     ██╔════╝ ██╔═══██╗██╔═══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝
   ██║  ███╗██║   ██║██║   ██║██║  ██║██████╔╝ ╚████╔╝ █████╗
  ██║   ██║██║   ██║██║   ██║██║  ██║██╔══██╗  ╚██╔╝  ██╔══╝
 ╚██████╔╝╚██████╔╝╚██████╔╝█████╔╝ ██████╔╝   ██║   ███████╗
  ╚═════╝  ╚═════╝  ╚═════╝ ╚════╝  ╚═════╝    ╚═╝   ╚══════╝

    [TERMINATE] MR Finder를 사용해주셔서 감사합니다!
    
───────────────────────────────────────────────────────
`;

    const pulse = chalkAnimation.pulse(banner);

    setTimeout(() => {
        pulse.stop();

        console.log(chalk.yellow(`\n[TERMINATE] EndTime : ${new Date().toString()}\n`));
    }, 3000);
};
