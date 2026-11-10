import Link from 'next/link';
import { leerDatosTaller } from '@/lib/ajustes';
import styles from './web.module.css';

export const dynamic = 'force-dynamic';

const servicios = [
  { n: '01', icono: '◈', titulo: 'Diagnóstico electrónico', texto: 'Identificamos el origen de la avería para saber por dónde empezar.' },
  { n: '02', icono: '⌁', titulo: 'Mantenimiento', texto: 'Revisiones y cuidados periódicos para que tu coche siga en forma.' },
  { n: '03', icono: '◎', titulo: 'Frenos y seguridad', texto: 'Revisión de los elementos que importan en cada trayecto.' },
  { n: '04', icono: '⚙', titulo: 'Mecánica general', texto: 'Atención para las reparaciones y necesidades de tu vehículo.' },
];

export default async function Inicio() {
  const taller = await leerDatosTaller();
  const telefono = taller.telefono.replace(/[^\d+]/g, '');
  const ubicacion = [taller.direccion, taller.cp, taller.ciudad].filter(Boolean).join(', ');
  const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ubicacion);
  return (
    <div className={styles.site}>
      <div className={styles.demoBar}>WEB DE DEMOSTRACIÓN <span>·</span> Un ejemplo de taller conectado</div>
      <header className={styles.header}><div className={styles.headerInner}>
        <a className={styles.brand} href="#inicio"><span className={styles.brandMark}>✳</span><span><strong>{taller.nombre}</strong><small>MECÁNICA &amp; AUTOMOCIÓN</small></span></a>
        <nav className={styles.nav} aria-label="Navegación principal"><a href="#servicios">Servicios</a><a href="#como-trabajamos">Cómo trabajamos</a><a href="#contacto">Contacto</a></nav>
        <div className={styles.headerActions}><Link className={styles.login} href="/entrar">Acceso taller ↗</Link><Link className={styles.headerCta} href="/chat">Pedir cita ↗</Link></div>
      </div></header>
      <main id="inicio">
        <section className={styles.hero}><div className={styles.glow} aria-hidden="true" /><div className={styles.wrap + ' ' + styles.heroGrid}>
          <div className={styles.heroCopy}><div className={styles.eyebrow}><span className={styles.dot} /> TU TALLER DE CONFIANZA <i /> {taller.ciudad.toUpperCase()}</div>
            <h1>Tu coche, en <br/>buenas manos.<br/><em>Sin sorpresas.</em></h1>
            <p>Cuidamos de tu vehículo y te mantenemos informado en cada paso. Un trato cercano, una explicación clara y el trabajo bien hecho.</p>
            <div className={styles.heroActions}><Link className={styles.primary} href="/chat">Hablar con el taller <span>↗</span></Link><a className={styles.secondary} href="#servicios">Descubrir servicios <span>↓</span></a></div>
            <div className={styles.heroNote}><span>✳</span> MECÁNICA Y ELECTRICIDAD <b> / </b> ATENCIÓN PERSONALIZADA</div>
          </div>
          <div className={styles.diagnostic} aria-label="Ilustración de una revisión de vehículo">
            <div className={styles.panelTop}><span><i className={styles.dot}/> FICHA DE REVISIÓN</span><span>CONTROL / 01</span></div>
            <div className={styles.carStage}><div className={styles.gridLines}/><svg viewBox="0 0 400 190" fill="none" aria-hidden="true"><path d="M42 125l12-30 45-12 39-41c8-8 18-12 31-12h95c13 0 24 5 34 16l33 37 28 8 10 19v28h-22M53 138H31v-17M120 138h151" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M109 82h200M143 42l-24 40m139-41 29 41M37 112h31m279-8h20M170 96h37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="87" cy="137" r="29" stroke="currentColor" strokeWidth="3"/><circle cx="87" cy="137" r="13" stroke="currentColor" strokeWidth="2"/><circle cx="309" cy="137" r="29" stroke="currentColor" strokeWidth="3"/><circle cx="309" cy="137" r="13" stroke="currentColor" strokeWidth="2"/></svg><div className={styles.carLabel}>TU VEHÍCULO <span>·</span> NUESTRA PRIORIDAD</div></div>
            <div className={styles.panelList}><div><span><b>01</b> Escuchamos tu consulta</span><strong>●</strong></div><div><span><b>02</b> Revisamos tu vehículo</span><strong>●</strong></div><div><span><b>03</b> Te explicamos el trabajo</span><strong>●</strong></div></div>
            <div className={styles.panelFoot}><span>ATENCIÓN EN CADA DETALLE</span><span>↗</span></div>
          </div>
        </div><div className={styles.wrap + ' ' + styles.heroBottom}><span>01 / CUIDAMOS LO QUE TE MUEVE</span><span>DESLIZA PARA DESCUBRIR ↓</span></div></section>
        <section id="servicios" className={styles.section}><div className={styles.wrap}><div className={styles.sectionHead}><div><div className={styles.kicker}>01 / NUESTROS SERVICIOS</div><h2>Todo lo que tu coche<br/><em>necesita.</em></h2></div><p>Desde una revisión hasta una reparación, te ayudamos a mantener tu vehículo preparado para lo que venga.</p></div>
          <div className={styles.services}>{servicios.map(s => <article className={styles.service} key={s.n}><div className={styles.serviceTop}><span className={styles.serviceIcon}>{s.icono}</span><span>{s.n} / 04</span></div><h3>{s.titulo}</h3><p>{s.texto}</p><Link href="/chat">Consultar servicio <span>↗</span></Link></article>)}</div>
        </div></section>
        <section id="como-trabajamos" className={styles.process}><div className={styles.wrap}><div className={styles.sectionHead}><div><div className={styles.kicker}>02 / ASÍ TRABAJAMOS</div><h2>Más claridad.<br/><em>Más tranquilidad.</em></h2></div><p>Una forma sencilla de cuidar tu coche, con información clara desde la primera consulta.</p></div><div className={styles.steps}><article><span>01</span><h3>Cuéntanos qué necesita</h3><p>Escríbenos para consultar tus dudas o solicitar una cita.</p></article><article><span>02</span><h3>Revisamos tu coche</h3><p>El equipo estudia el trabajo y te explica lo que necesita el vehículo.</p></article><article><span>03</span><h3>Seguimos en contacto</h3><p>Consulta con el taller la evolución de tu reparación.</p></article></div></div></section>
        <section className={styles.ctaSection}><div className={styles.wrap + ' ' + styles.ctaBox}><div><div className={styles.kicker}>¿HABLAMOS DE TU COCHE?</div><h2>Estamos aquí para<br/><em>echarte una mano.</em></h2><p>Cuéntanos qué necesitas y te ayudaremos con los siguientes pasos.</p></div><Link className={styles.primary} href="/chat">Iniciar consulta <span>↗</span></Link><span className={styles.ctaDecor} aria-hidden="true">✳</span></div></section>
        <section id="contacto" className={styles.contact}><div className={styles.wrap}><div className={styles.contactGrid}><div><div className={styles.kicker}>03 / CONTACTO</div><h2>Un taller cerca.<br/><em>Un equipo contigo.</em></h2><p>Ven a conocernos o ponte en contacto con nosotros. Estaremos encantados de atenderte.</p><div className={styles.contactLines}><div><span>UBICACIÓN</span><strong>{taller.direccion}<br/>{taller.cp}</strong></div><div><span>TELÉFONO</span><a href={'tel:' + telefono}>{taller.telefono} ↗</a></div><div><span>EMAIL</span><a href={'mailto:' + taller.email}>{taller.email} ↗</a></div></div><a href={mapa} target="_blank" rel="noreferrer" className={styles.secondary}>Cómo llegar <span>↗</span></a></div><div className={styles.locationCard}><div className={styles.locationGrid} aria-hidden="true"/><span className={styles.locationTag}>LOCALIZACIÓN / TALLER</span><div className={styles.pin}>✳</div><div className={styles.locationBottom}><small>NOS ENCONTRARÁS EN</small><strong>{taller.ciudad}</strong><span>{taller.direccion}</span></div></div></div></div></section>
      </main>
      <footer className={styles.footer}><div className={styles.wrap + ' ' + styles.footerInner}><div><a className={styles.brand} href="#inicio"><span className={styles.brandMark}>✳</span><span><strong>{taller.nombre}</strong><small>MECÁNICA &amp; AUTOMOCIÓN</small></span></a><p>Tu coche merece un buen equipo.</p></div><div className={styles.footerLinks}><a href="#servicios">Servicios</a><a href="#contacto">Contacto</a><Link href="/chat">Hablar con el taller</Link><Link href="/entrar">Acceso gestión ↗</Link></div></div><div className={styles.wrap + ' ' + styles.footerBottom}><span>© {new Date().getFullYear()} {taller.nombre} · Web de demostración</span><span>HECHO PARA SEGUIR ADELANTE ↗</span></div></footer>
    </div>
  );
}
