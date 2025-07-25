const LabHeroSection = document.querySelector('#LabHeroSection');
  let colorChange = false;
  const elH1 = document.querySelector('.galaxy-text');
  const textH1 = "Transforme a Gestão do Seu Laboratório com Inovação e Eficiência";
  let iH1 = 0;
  const elP = document.querySelector('#paragrafh');
  const textP = "Soluções avançadas que otimizam processos e garantem a conformidade regulatória em cada etapa.";
  let iP = 0;
  const normalH1 = document.querySelector('#NormalH1');
  const normalP = document.querySelector('#NormalP');
  const secondTextSection = document.querySelector('#secondText');
  const iso = document.querySelector('#seloIso');
  const isoimg = document.querySelector('#IsoImg');
  const expo = document.querySelector('#expoSection');
  const inscreen1 = document.querySelector('#inscreen1');
  const inscreen2 = document.querySelector('#inscreen2');
  const inscreen3 = document.querySelector('#inscreen3');
  const inscreen4 = document.querySelector('#inscreen4');
  const inscreen5 = document.querySelector('#inscreen5');
  const inscreen6 = document.querySelector('#inscreen6');
  const inscreen7 = document.querySelector('#inscreen7');
  const inscreen8 = document.querySelector('#inscreen8');
  const inscreen9 = document.querySelector('#inscreen9');
  const inscreen10 = document.querySelector('#inscreen10');

  const ocult1 = document.querySelector('#ocult1');
  const ocult2 = document.querySelector('#ocult2');
  const ocult3 = document.querySelector('#ocult3');
  const ocult4 = document.querySelector('#ocult4');
  const ocult5 = document.querySelector('#ocult5');
  const ocult6 = document.querySelector('#ocult6');
  const ocult7 = document.querySelector('#ocult7');
  const ocult8 = document.querySelector('#ocult8');
  const ocult9 = document.querySelector('#ocult9');
  const ocult10 = document.querySelector('#ocult10');
  const clientH1 = document.querySelector('#clients');
  let textClient = "Oque Nossos Clientes Dizem";
  let iClient = 0;
  const writher = document.querySelector('#writher');
  const textWrither = "Conheça as funcionalidades do Gerencialab";
  let iWrither = 0;
  let feitoWrither = false;
  let feitoSecond = false;
  let animacaoExecutada = false; // Variável de controle para execução única
  const persona = document.querySelector('#Persona');
  const textNormalH1 = "Sistema em Conformidade com ISO/IEC 17025:2017";
  const textNormalP = "Eleve o desempenho do seu laboratório com o Gerencialab, a solução ideal para garantir conformidade com a ISO/IEC 17025:2017.Nossa plataforma simplifica a gestão da qualidade, assegurando imparcialidade, confidencialidade e retenção eficiente de registros.Simplifique processos e alcance a excelência.";
  let iNormalH1 = 0;
  let iNormalP = 0;
  let scrollPositionOld = 0;
  let scrollPositionNow = 0;
  const playCertificar = document.querySelector('#certificarPlay');
  const playNugap = document.querySelector('#nugaPlay')
  const agenda = document.querySelector('#agend');
  const contactSection = document.querySelector('#contactSection');
  const form = document.querySelector('#contactSection form');
  const agendaText = "Agende uma demonstração GRATUITA agora!";
  const ultText = document.querySelector('#ultimateText')
  const riserH1 = document.querySelector('#riserH1');
  const riserP = document.querySelector('#riserP');
  const clicker = document.querySelector('#Clicker')
  const riserText = "Transforme Seu Laboratório Hoje!";
  const riserPtext = "Descubra Como o Gerencialab Pode Levar Sua Gestão Laboratorial ao Próximo Nível";
  const videoSection = document.querySelector('#videoSection');
  const sbn = document.querySelector('#sbn');
  const video = document.querySelector('#video')
  const especialImg = document.querySelector('#especialImg');
  const sbnText = "Um pouco sobre-nós";
  const burguer = document.querySelector('#buguinho');
  const burguerimg = document.querySelector('#buguinho img')
  const menuMobile = document.querySelector('#mobileNav');
  function enviarMensagemPersonalizada() {
            const nome = document.getElementById('Name').value;
            const lab = document.getElementById('Labo').value;
           
            
            if (!mensagem.trim()) {
                alert('Por favor, digite uma mensagem!');
                return;
            }
            
            let texto = '';
            if (nome.trim()) {
                texto = `Olá! Meu nome é ${nome}. ${lab}`;
            } else {
                texto = mensagem;
            }
            
            // Codifica a mensagem para URL
            const mensagemCodificada = encodeURIComponent(texto);
            const url = `https://wa.me/5531983817898?text=${mensagemCodificada}`;
            
            // Abre o WhatsApp em nova aba
            window.open(url, '_blank');
        }
        let clicked = false;
burguer.addEventListener('click', () => {
    if (!clicked){
        menuMobile.style.opacity = '1'
        clicked = true;
        burguerimg.src = "https://img.icons8.com/?size=100&id=FGBtcylNgqtz&format=png&color=000000";
    }else{
        menuMobile.style.opacity = '0'
        clicked = false
        burguerimg.src = "https://img.icons8.com/?size=100&id=qWk6VwJDFH47&format=png&color=000000";
    }
});
  clicker.addEventListener('click', () => {
    window.location.href = '#contactSection';
  })
  playCertificar.addEventListener('click', () => {
   window.open('https://www.youtube.com/watch?v=GdO7QUdq_es', '_blank');
  });
  playNugap.addEventListener('click', () => {
    window.open('https://www.youtube.com/watch?v=OvCA0JgzXhM', '_blank');
  })
  
  function typeNormal(Normal, i, textNormal, velocity) {
    if (Normal && i < textNormal.length) {
      Normal.innerHTML += textNormal.charAt(i);
      i++;
      setTimeout(() => typeNormal(Normal, i, textNormal, velocity), velocity);
    }
  }

  const observerSecond = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!feitoSecond) {
          feitoSecond = true;
          
          // Para o vídeo quando secondSection é vista
          if (video && !video.paused) {
            video.pause();
            video.currentTime = 0; // Opcional: volta ao início
            console.log('Vídeo parado ao visualizar secondSection');
          }
          
          isoimg.style.animationName = 'apareca';
          isoimg.style.animationDuration = '1.5s'
          isoimg.style.transition = '2s all';
          isoimg.style.animationFillMode = 'forwards';
          
          setTimeout(() => {
            iso.style.animationName = 'isoFadeIn';
            iso.style.animationDuration = '1.5s';
            iso.style.transition = '2s all';
            iso.style.animationFillMode = 'forwards';
            iso.style.animationTimingFunction = 'linear';
            setTimeout(() => {
              isoimg.style.animationName = 'teck';
              isoimg.style.animationDuration = '0.1s';
              normalH1.style.opacity = '1';
              normalH1.innerHTML = '';
              // Corrigido: chamada correta da função de digitação
              typeNormal(normalH1, 0, textNormalH1, 80);
              setTimeout(() => {
                normalP.style.opacity = '1';
                normalP.innerHTML = '';
                typeNormal(normalP, 0, textNormalP, 40);
              }, 1500);
            }, 1250);
          }, 1000);
        }
      }
    });
  }, { threshold: 0.3 });

  
  function aparing(inscreen, ocult) {  
    ocult.style.color = 'var(--cor05)';  
    inscreen.style.width = '100vw';
    inscreen.style.left = '50%';
    ocult.style.left = '50%';
    ocult.style.opacity = '1';
    inscreen.style.transform = 'translateX(-50%)';
    ocult.style.display = 'flex';
    
    setTimeout(() => {
      inscreen.style.animationName = 'FunctionsFadeIn';
      inscreen.style.animationDuration = '1s';
      inscreen.style.animationFillMode = 'forwards';
    }, 50);
    
    setTimeout(() => {
        ocult.style.animationName = 'TextH1FadeIn';
        ocult.style.animationDuration = '2s';
        ocult.style.animationFillMode = 'forwards';
        
        setTimeout(() => {
            inscreen.style.animation = 'FunctionsFadeOut';
            inscreen.style.animationDuration = '2s';
          inscreen.style.animationFillMode = 'forwards';
          setTimeout(() => {
            inscreen.style.display = 'none'
          }, 1250);
        }, 1500);
    }, 2000);
  }

  const observerWrither = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!feitoWrither) {
          feitoWrither = true;
          typeWrither();
        }
      }
    });
  }, { threshold: 0.3 });
function verificarOrientacao() {
  if (window.matchMedia("(orientation: portrait)").matches) {
        inscreen1.style.width = '70vw'
        inscreen2.style.width = '70vw'
        inscreen3.style.width = '70vw'
        inscreen4.style.width = '70vw'
        inscreen5.style.width = '70vw'
        inscreen6.style.width = '70vw'
        inscreen7.style.width = '70vw'
        inscreen8.style.width = '70vw'
        inscreen9.style.width = '70vw'
        inscreen10.style.width = '70vw'
  } else {
    return "landscape";
  }
}
  const observerInscreens = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animacaoExecutada) {
        animacaoExecutada = true; // Marca que a animação já foi executada
        
        if (!feitoSecond) {
          ocult1.style.color = 'var(--cor05)';
        } else {
          ocult1.style.color = 'var(--cor01)';
        }

        verificarOrientacao()
        inscreen1.style.transform = 'translateX(-50%)';
        inscreen1.style.zIndex = '10';
        inscreen2.style.transform = 'translateX(-38.75%)';
        inscreen2.style.zIndex = '9';
        inscreen3.style.transform = 'translateX(-81.25%)';
        inscreen3.style.zIndex = '8';
        inscreen4.style.transform = 'translateX(-25%)';
        inscreen4.style.zIndex = '7';
        inscreen5.style.transform = 'translateX(-100%)';
        inscreen5.style.zIndex = '6';
        inscreen6.style.transform = 'translateX(-6.25%)';
        inscreen6.style.zIndex = '5';
        inscreen7.style.transform = 'translateX(-118.75%)';
        inscreen7.style.zIndex = '4';
        inscreen8.style.transform = 'translateX(12.5%)';
        inscreen8.style.zIndex = '3';
        inscreen9.style.transform = 'translateX(-137.5%)';
        inscreen9.style.zIndex = '2';
        inscreen10.style.transform = 'translateX(31.25%)';
        inscreen10.style.zIndex = '1';
        
        // Array dos elementos para animação sequencial
        const inscreensArray = [inscreen9, inscreen7, inscreen5, inscreen3, inscreen1, inscreen2, inscreen4, inscreen6, inscreen8, inscreen10];
       
        // Animação de saída sequencial
        setTimeout(()=> {
            inscreensArray.forEach((element, index) => {
          setTimeout(() => {
            element.style.top = '343vh';
            element.style.transition = '0.5s all';
            element.style.opacity = '0';
          }, index === 0 ? 0 : (index < 5 ? 250 * index : 2000 + 250 * (index - 8)));
        });
        
        }, 2000)
         setTimeout(() => {
  inscreen1.style.left = '50%';
  inscreen1.style.transform = 'translateX(-50%)';

  inscreen2.style.left = '50%';
  inscreen2.style.transform = 'translateX(-50%)';

  inscreen3.style.left = '50%';
  inscreen3.style.transform = 'translateX(-50%)';

  inscreen4.style.left = '50%';
  inscreen4.style.transform = 'translateX(-50%)';

  inscreen5.style.left = '50%';
  inscreen5.style.transform = 'translateX(-50%)';

  inscreen6.style.left = '50%';
  inscreen6.style.transform = 'translateX(-50%)';

  inscreen7.style.left = '50%';
  inscreen7.style.transform = 'translateX(-50%)';

  inscreen8.style.left = '50%';
  inscreen8.style.transform = 'translateX(-50%)';

  inscreen9.style.left = '50%';
  inscreen9.style.transform = 'translateX(-50%)';

  inscreen10.style.left = '50%';
  inscreen10.style.transform = 'translateX(-50%)';
}, 5000);
        // Animação de entrada das funcionalidades
        setTimeout(() => {
          const aparingElements = [
            [inscreen1, ocult1],
            [inscreen2, ocult2],
            [inscreen3, ocult3],
            [inscreen4, ocult4],
            [inscreen5, ocult5],
            [inscreen6, ocult6],
            [inscreen7, ocult7],
            [inscreen8, ocult8],
            [inscreen9, ocult9],
            [inscreen10, ocult10]
          ];

          // Executa sequencialmente com delay de 2500ms entre cada um
          aparingElements.forEach(([inscreen, ocult], index) => {
            setTimeout(() => {
              aparing(inscreen, ocult);
              console.log(index)
            }, index * 5000);
            
          });

        }, 6000); // Aguarda a animação de saída terminar
      }
    });
  }, { threshold: 0.5 });
  
  let feitO = false;
  const observerPersona = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!feitO){
          typeNormal(clientH1, 0, textClient, 80)
          feitO = true;
        }
      }
    });
  }, { threshold: 0.3 });
  
  let feitoAgenda = false
  const observerForm = new IntersectionObserver((entries) => {
    
    entries.forEach(entry => {
      
      if (entry.isIntersecting){
        if (!feitoAgenda){
          typeNormal(agenda, 0, agendaText, 80);
          form.style.animationName = 'apareca';
          form.style.animationDuration = '2s';
          form.style.animationFillMode = 'forwards';
          feitoAgenda = true;
        }
      }
    })
  },{
    threshold: 0.3
  });
  
  let feitoRiser = false;
  const observerRiser = new IntersectionObserver((entries) => {
    entries.forEach (entry => {
      
      if (entry.isIntersecting){
        if (!feitoRiser){
          
            especialImg.style.animationName = 'apareca';
          especialImg.style.animationDuration = '1.5s'
          especialImg.style.transition = '2s all';
          especialImg.style.animationFillMode = 'forwards';
           clicker.style.animationName = 'apareca';
          clicker.style.animationDuration = '1.5s'
          clicker.style.transition = '2s all';
          clicker.style.animationFillMode = 'forwards';
          
          setTimeout(() => {
            typeNormal(riserH1, 0, riserText, 80);
          feitoRiser = true;
          setTimeout(()=> {
            typeNormal(riserP, 0, riserPtext, 80);
          }, 2000)
          }, 500);
        }
      }
    })
  }, {
    threshold: 0.3
  })
  
  // Observer do vídeo corrigido
  let foiFeitoVideo = false;
  const observerVideo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting){
        if (!foiFeitoVideo){
          typeNormal(sbn, 0, sbnText, 80);
          foiFeitoVideo = true;
          
          // Correção para autoplay do vídeo
          if (video) {
            video.muted = true; // Necessário para autoplay funcionar na maioria dos navegadores
            video.autoplay = true;
            
            // Tentativa de reprodução com tratamento de erro
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Vídeo iniciado automaticamente');
                })
                .catch(error => {
                  console.log('Autoplay foi bloqueado:', error);
                  // Fallback: mostrar controles para o usuário
                  video.controls = true;
                });
            }
          }
        }
      }
    })
  }, {
    threshold: 0.3
  })
  
  // Observando as seções
  observerVideo.observe(videoSection)
  observerRiser.observe(ultText)
  observerPersona.observe(persona)
  observerForm.observe(contactSection)
  observerInscreens.observe(inscreen1);
  observerSecond.observe(secondTextSection);
  observerWrither.observe(writher);

  document.addEventListener('DOMContentLoaded', function() {
    if (elH1) {
      elH1.textContent = '';
      elH1.classList.add('typewriter-cursor');
    }
    
    if (writher) {
      writher.textContent = '';
      writher.classList.add('typewriter-cursor');
    }
    
    function typeH1() {
      if (elH1 && iH1 < textH1.length) {
        elH1.textContent += textH1.charAt(iH1);
        iH1++;
        setTimeout(typeH1, 80);
      } else if (elH1) {
        elH1.classList.remove('typewriter-cursor');
      }
    }

    function typeP() {
      if (elP && iP < textP.length) {
        elP.innerHTML += textP.charAt(iP);
        iP++;
        setTimeout(typeP, 50);
      } else if (elP) {
        elP.classList.remove('typewriter-cursor');
      }
    }

    typeH1();
    setTimeout(() => {
      typeP();
    }, 6000);
  });

  function typeWrither() {
    if (writher && iWrither < textWrither.length) {
      writher.textContent += textWrither.charAt(iWrither);
      iWrither++;
      setTimeout(typeWrither, 80);
    } else if (writher) {
      writher.classList.remove('typewriter-cursor');
    }
  }